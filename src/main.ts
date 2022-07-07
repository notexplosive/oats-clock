import { Graphics, Container, Point, ILineStyleOptions, IPointData, Text, IPoint } from 'pixi.js';
import { game } from './limbo';
import { Tween, TweenChain, Tweenable, TweenableNumber, EaseFunction, EaseFunctions, MultiplexTween, CallbackTween, ITween } from './limbo/data/tween';
import { CirclePrimitive } from './limbo/render/primitive';
import { pointMagnitude, subtractPoints, addPoints, multiplyPoint } from './limbo/functions/point-math';


const maxSecondsPerDay = 86400
let topHalf: ClockContainer;
let bottomHalf: ClockContainer;

export function main() {
    let backgroundFill = new Graphics()
    backgroundFill.beginFill(0xcccccc);
    backgroundFill.drawRect(0, 0, 1600, 900)

    game.rootContainer.addChild(backgroundFill)

    topHalf = new ClockContainer(0xff0000)
    bottomHalf = new ClockContainer(0x0000ff)

    let lightMask = new Graphics()
    lightMask.beginFill(0xffffff);
    lightMask.drawRect(0, 0, 1600, 900 / 2)
    topHalf.mask = lightMask

    let darkMask = new Graphics()
    darkMask.beginFill(0xff0000);
    darkMask.drawRect(0, 900 / 2, 1600, 900 / 2)
    bottomHalf.mask = darkMask

    // clock.mask = lightMask
}

// 20 hours in a day
// 20 minutes per hour
// 216 seconds per minute

export function update(dt: number) {
    let time = new Date()
    let currentSeconds = time.getSeconds() + time.getMinutes() * 60 + time.getHours() * 60 * 60
    for (let clock of [topHalf, bottomHalf]) {
        clock.sun.position = clock.dayTrack.points.getValueAtPercent(currentSeconds / maxSecondsPerDay)
        const secondsInAnHour = 216 * 20
        clock.oat.position = clock.minuteTrack.points.getValueAtPercent(currentSeconds % secondsInAnHour / secondsInAnHour)
        clock.secondOat.position = clock.minuteTrack.points.getValueAtPercent(currentSeconds % 216 / 216)

        clock.digitalDisplay.text =
            `${Math.floor(currentSeconds / 20 / 216)
            }:${Math.floor(currentSeconds / 216 % 20).toLocaleString('en-US', {
                minimumIntegerDigits: 2,
                useGrouping: false
            })
            }:${(currentSeconds % 216).toLocaleString('en-US', {
                minimumIntegerDigits: 3,
                useGrouping: false
            })
            }`
        clock.digitalDisplay.position = multiplyPoint({ x: clock.digitalDisplay.width, y: clock.digitalDisplay.height }, -0.5)
    }
}

function createOval(addedWidth: number, addedHeight: number, radius: number, scale: number, lineWidth: number, color: number) {
    let outlineGraphics = new Graphics()
    outlineGraphics.clear();

    radius = radius * scale
    addedWidth = addedWidth * scale
    addedHeight = addedHeight * scale

    let totalWidth = addedWidth + radius * 2
    let totalHeight = addedHeight + radius * 2
    outlineGraphics.position = new Point(-totalWidth / 2, -totalHeight / 2)
    let randomAccessTween = drawRoundedCircle(outlineGraphics, radius, addedWidth, addedHeight, { color: color, width: lineWidth, alpha: 1 })

    return new Track(outlineGraphics, randomAccessTween, { x: totalWidth, y: totalHeight })
}

export class Track {
    readonly graphics: Graphics;
    readonly points: RandomAccessTween;
    readonly size: IPointData;
    constructor(graphics: Graphics, trackPoints: RandomAccessTween, size: IPointData) {
        this.graphics = graphics
        this.points = trackPoints
        this.size = size
    }
}

function drawRoundedCircle(graphics: Graphics, radius: number, extraWidth: number, extraHeight: number, lineStyle: ILineStyleOptions) {

    graphics.lineStyle(lineStyle);

    let top = 0
    let left = 0
    let totalHeight = radius * 2 + extraHeight
    let totalWidth = radius * 2 + extraWidth

    // we start here because that's the 0 position on the clock
    let startingX = totalWidth / 2
    let startingY = totalHeight

    let tweenableX = TweenableNumber.FromConstant(startingX)
    let tweenableY = TweenableNumber.FromConstant(startingY)


    let halfCircumphrance = Math.PI * radius
    let xTravelDuration = extraWidth / halfCircumphrance * 2
    let yTravelDuration = extraHeight / halfCircumphrance * 2
    let cornerDuration = 1

    let tween = new TweenChain()
        .add(new CallbackTween(() => {
            tweenableX.set(startingX)
            tweenableY.set(startingY)
        }))

        // bottom edge, going left
        .add(new Tween(tweenableX, radius, xTravelDuration / 2, EaseFunctions.linear))

        // bottom left corner
        .add(new MultiplexTween()
            .addChannel(new Tween(tweenableX, 0, cornerDuration, EaseFunctions.sineFastSlow))
            .addChannel(new Tween(tweenableY, totalHeight - radius, cornerDuration, EaseFunctions.sineSlowFast)))

        // left edge, going up
        .add(new Tween(tweenableY, radius, yTravelDuration, EaseFunctions.linear))

        // top left corner
        .add(new MultiplexTween()
            .addChannel(new Tween(tweenableX, radius, cornerDuration, EaseFunctions.sineSlowFast))
            .addChannel(new Tween(tweenableY, 0, cornerDuration, EaseFunctions.sineFastSlow)))

        // top edge, going right
        .add(new Tween(tweenableX, totalWidth - radius, xTravelDuration, EaseFunctions.linear))

        // top right corner
        .add(new MultiplexTween()
            .addChannel(new Tween(tweenableX, totalWidth, cornerDuration, EaseFunctions.sineFastSlow))
            .addChannel(new Tween(tweenableY, radius, cornerDuration, EaseFunctions.sineSlowFast)))

        // right edge, going down
        .add(new Tween(tweenableY, totalHeight - radius, yTravelDuration, EaseFunctions.linear))

        // bottom right corner
        .add(new MultiplexTween()
            .addChannel(new Tween(tweenableX, totalWidth - radius, cornerDuration, EaseFunctions.sineSlowFast))
            .addChannel(new Tween(tweenableY, totalHeight, cornerDuration, EaseFunctions.sineFastSlow)))

        // bottom edge, going left (closing the loop)
        .add(new Tween(tweenableX, startingX, xTravelDuration / 2, EaseFunctions.linear))

    function drawLineToCurrentTweenable() {
        graphics.lineTo(tweenableX.get(), tweenableY.get())
    }

    function drawCorner(startTimestamp: number) {
        let cornerIncrement = 0.05
        for (let time = startTimestamp; time < startTimestamp + cornerDuration; time += cornerIncrement) {
            tween.jumpTo(time)
            drawLineToCurrentTweenable()
        }
    }


    graphics.moveTo(startingX, startingY)

    // Jump around the tween and trace the line segments as we go

    tween.jumpTo(xTravelDuration / 2)
    drawLineToCurrentTweenable()
    drawCorner(xTravelDuration / 2)

    tween.jumpTo(xTravelDuration / 2 + cornerDuration + yTravelDuration)
    drawLineToCurrentTweenable()
    drawCorner(xTravelDuration / 2 + cornerDuration + yTravelDuration)

    tween.jumpTo(xTravelDuration / 2 + cornerDuration * 2 + yTravelDuration + xTravelDuration)
    drawLineToCurrentTweenable()
    drawCorner(xTravelDuration / 2 + cornerDuration * 2 + yTravelDuration + xTravelDuration)

    tween.jumpTo(xTravelDuration / 2 + cornerDuration * 3 + yTravelDuration + xTravelDuration + yTravelDuration)
    drawLineToCurrentTweenable()
    drawCorner(xTravelDuration / 2 + cornerDuration * 3 + yTravelDuration + xTravelDuration + yTravelDuration)

    tween.jumpTo(xTravelDuration / 2 + cornerDuration * 4 + yTravelDuration + xTravelDuration + yTravelDuration + xTravelDuration / 2)
    drawLineToCurrentTweenable()

    return new RandomAccessTween(tween, tweenableX, tweenableY)
}

export class RandomAccessTween {
    readonly x: TweenableNumber;
    readonly y: TweenableNumber;
    readonly tween: ITween;

    constructor(tween: ITween, x: TweenableNumber, y: TweenableNumber) {
        this.tween = tween
        this.x = x;
        this.y = y;
    }

    getValueAtPercent(percent: number) {
        let targetTime = this.tween.getDuration() * percent
        this.tween.jumpTo(targetTime)

        return { x: this.x.get(), y: this.y.get() }
    }
}

export class ClockContainer extends Container {
    readonly sun: CirclePrimitive;
    readonly oat: CirclePrimitive;
    readonly secondOat: CirclePrimitive;
    readonly dayTrack: Track;
    readonly minuteTrack: Track;
    readonly digitalDisplay: Text;
    readonly url: Text;

    constructor(foregroundColor: number) {
        super()
        this.sun = new CirclePrimitive(true, 25, { color: foregroundColor })
        this.oat = new CirclePrimitive(true, 25, { color: foregroundColor })
        this.secondOat = new CirclePrimitive(true, 15, { color: foregroundColor })
        this.digitalDisplay = new Text("00:00:00", { fontSize: 100, fill: foregroundColor });
        this.url = new Text("notexplosive.net", { fontSize: 40 });
        this.url.position = { x: -this.url.width / 2, y: -this.url.height / 2 }

        const ovalWidth = 600
        const ovalHeight = 450
        let border = createOval(ovalWidth, 0, ovalHeight, 0.8, 20, foregroundColor)
        this.addChild(border.graphics)

        const minuteTrackInset = 100
        this.minuteTrack = createOval(ovalWidth - minuteTrackInset, 0, ovalHeight - minuteTrackInset, 0.8, 5, foregroundColor)
        this.addChild(this.minuteTrack.graphics)

        const dayTrackInset = 200
        this.dayTrack = createOval(ovalWidth - dayTrackInset, 0, ovalHeight - dayTrackInset, 0.8, 5, foregroundColor)
        this.addChild(this.dayTrack.graphics)

        const numbersInset = 50
        let numbersTrack = createOval(ovalWidth - numbersInset, 0, ovalHeight - numbersInset, 0.8, 5, foregroundColor)

        game.rootContainer.addChild(this)

        this.dayTrack.graphics.addChild(this.sun)
        this.minuteTrack.graphics.addChild(this.oat)
        this.minuteTrack.graphics.addChild(this.secondOat)


        // numbered labels
        {
            let textRoot = new Container()
            this.addChild(textRoot)
            textRoot.position = multiplyPoint(numbersTrack.size, -0.5)

            for (let i = 1; i <= 20; i++) {
                let textContainer = new Container()
                textRoot.addChild(textContainer)
                let text = textContainer.addChild(new Text(i, { fontFamily: "Roboto", fontSize: 50, fill: 0x222222 }))
                text.position = new Point(-text.width / 2, -text.height / 2)
                textContainer.position = numbersTrack.points.getValueAtPercent(i / 20)
            }
        }

        this.addChild(this.digitalDisplay)

        let urlParent = new Container()
        urlParent.addChild(this.url)
        this.addChild(urlParent)

        urlParent.position.y = 110

        this.position = new Point(1600 / 2, 900 / 2)

    }

}
