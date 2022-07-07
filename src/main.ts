import { Graphics, Container, Point, ILineStyleOptions, IPointData, Text, IPoint } from 'pixi.js';
import { game } from './limbo';
import { Tween, TweenChain, Tweenable, TweenableNumber, EaseFunction, EaseFunctions, MultiplexTween, CallbackTween, ITween } from './limbo/data/tween';
import { CirclePrimitive } from './limbo/render/primitive';
import { pointMagnitude, subtractPoints, addPoints, multiplyPoint } from './limbo/functions/point-math';


const maxSecondsPerDay = 86400
let sun = new CirclePrimitive(true, 25, { color: 0xffff00 })
let oat = new CirclePrimitive(true, 25, { color: 0x00ffaa })
let dayTrack: Track;
let minuteTrack: Track;
let digitalDisplay: Text = new Text("00:00:00", { fontSize: 100 });
let url: Text = new Text("notexplosive.net", { fontSize: 50 });

export function main() {
    let clock = new Container()
    clock.position = new Point(1600 / 2, 900 / 2)

    let border = createOval(800, 0, 450, 0.8, 20)
    clock.addChild(border.graphics)

    let minuteTrackInset = 75
    minuteTrack = createOval(800 - minuteTrackInset, 0, 450 - minuteTrackInset, 0.8, 5)
    clock.addChild(minuteTrack.graphics)

    let dayTrackInset = 150
    dayTrack = createOval(800 - dayTrackInset, 0, 450 - dayTrackInset, 0.8, 5)
    clock.addChild(dayTrack.graphics)

    let numbersTrack = createOval(800 - 0, 0, 450 - 50, 0.8, 5)

    let bg = new Graphics()
    bg.beginFill(0xcccccc);
    bg.drawRect(0, 0, 1600, 900)

    game.rootContainer.addChild(bg)
    game.rootContainer.addChild(clock)

    dayTrack.graphics.addChild(sun)
    minuteTrack.graphics.addChild(oat)
    let textRoot = new Container()
    textRoot.position = multiplyPoint(numbersTrack.size, -0.5)

    for (let i = 1; i <= 20; i++) {
        let textContainer = new Container()
        textRoot.addChild(textContainer)
        let text = textContainer.addChild(new Text(i, { fontFamily: "Roboto", fontSize: 50, fill: 0xff00ff }))
        text.position = new Point(-text.width / 2, -text.height / 2)
        textContainer.position = numbersTrack.points.getValueAtPercent(i / 20)
    }

    // textHolder.position = new Point(-600, -325)
    clock.addChild(textRoot)

    clock.addChild(digitalDisplay)
    clock.addChild(url)
}

// 20 hours in a day
// 20 minutes per hour
// 216 seconds per minute

export function update(dt: number) {
    let time = new Date()
    let totalSecondsInDay = time.getSeconds() + time.getMinutes() * 60 + time.getHours() * 60 * 60
    // sun.position = dayTrack.points[dayTrack.points.length - Math.floor(totalSecondsInDay) % dayTrack.points.length - 1]
    // let p = Math.floor((minuteTrack.points.length - (Math.floor((totalSecondsInDay % 216) / 216 * minuteTrack.points.length)) - 1) / 20)

    // oat.position = minuteTrack.points[p]

    digitalDisplay.text = `${Math.floor(totalSecondsInDay / 20 / 216)}:${Math.floor(totalSecondsInDay / 216 % 20)}:${totalSecondsInDay % 216}`
}

function createOval(addedWidth: number, addedHeight: number, radius: number, scale: number, lineWidth: number) {
    let outlineGraphics = new Graphics()
    outlineGraphics.clear();

    radius = radius * scale
    addedWidth = addedWidth * scale
    addedHeight = addedHeight * scale

    let totalWidth = addedWidth + radius * 2
    let totalHeight = addedHeight + radius * 2
    outlineGraphics.position = new Point(-totalWidth / 2, -totalHeight / 2)
    let randomAccessTween = drawRoundedCircle(outlineGraphics, radius, addedWidth, addedHeight, { color: 0x333333, width: lineWidth, alpha: 1 })

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