import { Graphics, Container, Point, ILineStyleOptions, IPointData, Text, IPoint, IFillStyleOptions, Circle } from 'pixi.js';
import { game } from './limbo';
import { Tween, TweenChain, Tweenable, TweenableNumber, EaseFunction, EaseFunctions, MultiplexTween, CallbackTween, ITween } from './limbo/data/tween';
import { CirclePrimitive } from './limbo/render/primitive';
import { pointMagnitude, subtractPoints, addPoints, multiplyPoint } from './limbo/functions/point-math';


const maxSecondsPerDay = 86400
let topHalf: ClockContainer;
let bottomHalf: ClockContainer;
const digitalDisplay = new Text("00:00:00", { fontSize: 100, fill: 0x333333 });
const displayHolder = new Graphics()

export function main() {
    let backgroundFill = new Graphics()
    backgroundFill.beginFill(0x999999);
    backgroundFill.drawRect(0, 0, 1600, 900)

    game.rootContainer.addChild(backgroundFill)

    topHalf = new ClockContainer(0x333333, 0xeeeeee)
    bottomHalf = new ClockContainer(0xeeeeee, 0x333333)

    let lightMask = new Graphics()
    lightMask.beginFill(0xffffff);
    lightMask.drawRect(0, 0, 1600, 900 / 2)
    topHalf.mask = lightMask

    let darkMask = new Graphics()
    darkMask.beginFill(0xff0000);
    darkMask.drawRect(0, 900 / 2, 1600, 900 / 2)
    bottomHalf.mask = darkMask

    displayHolder.addChild(digitalDisplay)
    displayHolder.position = new Point(1600 / 2, 900 / 2)
    game.rootContainer.addChild(displayHolder)

    // clock.mask = lightMask
}

// 20 hours in a day
// 20 minutes per hour
// 216 seconds per minute

export function update(dt: number) {
    let time = new Date()
    let currentSeconds = time.getSeconds() + time.getMinutes() * 60 + time.getHours() * 60 * 60
    let currentSecondsPrecise = time.getMilliseconds() / 1000 + time.getSeconds() + time.getMinutes() * 60 + time.getHours() * 60 * 60
    for (let clock of [topHalf, bottomHalf]) {
        clock.sun.position = clock.dayTrack.points.getValueAtPercent(currentSeconds / maxSecondsPerDay)
        const secondsInAnHour = 216 * 20
        clock.oat.position = clock.minuteTrack.points.getValueAtPercent(currentSeconds % secondsInAnHour / secondsInAnHour)
        clock.secondOat.position = clock.minuteTrack.points.getValueAtPercent(currentSecondsPrecise % 216 / 216)

        clock.sun.rotation = Math.sin(time.getTime() / 500) / 10
    }

    digitalDisplay.text =
        `${Math.floor(currentSeconds / 20 / 216 + 1) // add one hour because everything is off-by-one
        }:${Math.floor(currentSeconds / 216 % 20).toLocaleString('en-US', {
            minimumIntegerDigits: 2,
            useGrouping: false
        })
        }:${(currentSeconds % 216).toLocaleString('en-US', {
            minimumIntegerDigits: 3,
            useGrouping: false
        })
        }`
    digitalDisplay.position = multiplyPoint({ x: digitalDisplay.width, y: digitalDisplay.height }, -0.5)

    displayHolder.clear()
    displayHolder.beginFill(0xeeeeee, 1)
    displayHolder.drawRect(-digitalDisplay.width / 2, -digitalDisplay.height / 2, digitalDisplay.width, digitalDisplay.height)
    displayHolder.lineStyle(4, 0x333333, 1)
    displayHolder.drawRect(-digitalDisplay.width / 2, -digitalDisplay.height / 2, digitalDisplay.width, digitalDisplay.height)
}

function createOval(addedWidth: number, addedHeight: number, radius: number, scale: number, lineWidth: number, foregroundColor: number, backgroundColor: number) {
    let outlineGraphics = new Graphics()
    outlineGraphics.clear();

    radius = radius * scale
    addedWidth = addedWidth * scale
    addedHeight = addedHeight * scale

    let totalWidth = addedWidth + radius * 2
    let totalHeight = addedHeight + radius * 2
    outlineGraphics.position = new Point(-totalWidth / 2, -totalHeight / 2)
    let randomAccessTween = drawRoundedCircle(outlineGraphics, radius, addedWidth, addedHeight, { color: foregroundColor, width: lineWidth, alpha: 1 }, { alpha: 1, color: backgroundColor })

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

function drawRoundedCircle(graphics: Graphics, radius: number, extraWidth: number, extraHeight: number, lineStyle: ILineStyleOptions, fillStyle: IFillStyleOptions) {
    let painter = new OvalTweenDrawer(graphics, radius, extraWidth, extraHeight)

    function travelAroundShape() {
        // Jump around the tween and trace the line segments as we go
        painter.tween.jumpTo(painter.xTravelDuration / 2)
        painter.drawLineToCurrentTweenable()
        painter.drawCorner(painter.xTravelDuration / 2)

        painter.tween.jumpTo(painter.xTravelDuration / 2 + painter.cornerDuration + painter.yTravelDuration)
        painter.drawLineToCurrentTweenable()
        painter.drawCorner(painter.xTravelDuration / 2 + painter.cornerDuration + painter.yTravelDuration)

        painter.tween.jumpTo(painter.xTravelDuration / 2 + painter.cornerDuration * 2 + painter.yTravelDuration + painter.xTravelDuration)
        painter.drawLineToCurrentTweenable()
        painter.drawCorner(painter.xTravelDuration / 2 + painter.cornerDuration * 2 + painter.yTravelDuration + painter.xTravelDuration)

        painter.tween.jumpTo(painter.xTravelDuration / 2 + painter.cornerDuration * 3 + painter.yTravelDuration + painter.xTravelDuration + painter.yTravelDuration)
        painter.drawLineToCurrentTweenable()
        painter.drawCorner(painter.xTravelDuration / 2 + painter.cornerDuration * 3 + painter.yTravelDuration + painter.xTravelDuration + painter.yTravelDuration)

        painter.tween.jumpTo(painter.xTravelDuration / 2 + painter.cornerDuration * 4 + painter.yTravelDuration + painter.xTravelDuration + painter.yTravelDuration + painter.xTravelDuration / 2)
        painter.drawLineToCurrentTweenable()
    }

    painter.graphics.beginFill(fillStyle.color, fillStyle.alpha);
    travelAroundShape()

    painter.graphics.lineStyle(lineStyle);
    travelAroundShape()


    return new RandomAccessTween(painter.tween, painter.tweenableX, painter.tweenableY)
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
    readonly url: Text;

    constructor(foregroundColor: number, backgroundColor: number) {
        super()
        this.sun = new CirclePrimitive(true, 25, { color: foregroundColor })
        for (let i = 0; i < Math.PI * 2; i += Math.PI / 4) {
            let child = this.sun.addChild(new CirclePrimitive(true, 8, { color: foregroundColor }))
            child.position = { x: Math.cos(i) * 25, y: Math.sin(i) * 25 }
        }
        let sunFace = this.sun.addChild(new Graphics())
        sunFace.beginFill(backgroundColor, 1)
        sunFace.drawCircle(-10, -10, 5)
        sunFace.drawCircle(10, -10, 5)
        sunFace.endFill()

        sunFace.lineStyle({ width: 3, alpha: 1, color: backgroundColor })
        sunFace.moveTo(-10, 5)
        sunFace.lineTo(0, 10)
        sunFace.lineTo(10, 5)

        this.oat = new CirclePrimitive(true, 15, { color: foregroundColor })
        this.secondOat = new CirclePrimitive(true, 10, { color: foregroundColor })
        this.url = new Text("notexplosive.net", { fontSize: 40, fill: foregroundColor });
        this.url.position = { x: -this.url.width / 2, y: -this.url.height / 2 }

        const ovalWidth = 600
        const ovalHeight = 450
        let border = createOval(ovalWidth, 0, ovalHeight, 0.8, 20, foregroundColor, backgroundColor)
        this.addChild(border.graphics)

        const minuteTrackInset = 100
        this.minuteTrack = createOval(ovalWidth - minuteTrackInset, 0, ovalHeight - minuteTrackInset, 0.8, 5, foregroundColor, backgroundColor)
        this.addChild(this.minuteTrack.graphics)

        const dayTrackInset = 200
        this.dayTrack = createOval(ovalWidth - dayTrackInset, 0, ovalHeight - dayTrackInset, 0.8, 5, foregroundColor, backgroundColor)
        this.addChild(this.dayTrack.graphics)

        const numbersInset = 50
        let numbersTrack = createOval(ovalWidth - numbersInset, 0, ovalHeight - numbersInset, 0.8, 5, foregroundColor, backgroundColor)

        game.rootContainer.addChild(this)

        this.dayTrack.graphics.addChild(this.sun)
        this.minuteTrack.graphics.addChild(this.oat)
        this.minuteTrack.graphics.addChild(this.secondOat)


        // numbered labels
        {
            let textRoot = new Container()
            this.addChild(textRoot)
            textRoot.position = multiplyPoint(numbersTrack.size, -0.5)

            for (let i = 0; i < 20; i++) {
                let textContainer = new Container()
                textRoot.addChild(textContainer)
                let text = textContainer.addChild(new Text(i + 1, { fontFamily: "Roboto", fontSize: 50, fill: foregroundColor }))
                text.position = new Point(-text.width / 2, -text.height / 2)
                textContainer.position = numbersTrack.points.getValueAtPercent(i / 20)
            }
        }

        let urlParent = new Container()
        urlParent.addChild(this.url)
        this.addChild(urlParent)

        urlParent.position.y = 110

        this.position = new Point(1600 / 2, 900 / 2)

    }

}

// Abusing my tweening library to draw curves
export class OvalTweenDrawer {
    readonly graphics: Graphics;
    readonly tweenableX: TweenableNumber;
    readonly tweenableY: TweenableNumber;
    readonly cornerDuration: number;
    readonly tween: TweenChain;
    readonly xTravelDuration: number;
    readonly yTravelDuration: number;

    constructor(graphics: Graphics, radius: number, extraWidth: number, extraHeight: number) {
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

        graphics.moveTo(startingX, startingY)

        this.graphics = graphics
        this.tweenableX = tweenableX
        this.tweenableY = tweenableY
        this.cornerDuration = cornerDuration
        this.tween = tween
        this.xTravelDuration = xTravelDuration
        this.yTravelDuration = yTravelDuration
    }

    drawLineToCurrentTweenable() {
        this.graphics.lineTo(this.tweenableX.get(), this.tweenableY.get())
    }

    drawCorner(startTimestamp: number) {
        let cornerIncrement = 0.05
        for (let time = startTimestamp; time < startTimestamp + this.cornerDuration; time += cornerIncrement) {
            this.tween.jumpTo(time)
            this.drawLineToCurrentTweenable()
        }
    }
}