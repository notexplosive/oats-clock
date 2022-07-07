import { Graphics, Container, Point, ILineStyleOptions, IPointData, Text } from 'pixi.js';
import { game } from './limbo';
import { Tween, TweenChain, Tweenable, TweenableNumber, EaseFunction, EaseFunctions, MultiplexTween, CallbackTween } from './limbo/data/tween';
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

    minuteTrack = createOval(800 - 75, 0, 450 - 75, 0.8, 5)
    clock.addChild(minuteTrack.graphics)

    dayTrack = createOval(800 - 150, 0, 450 - 150, 0.8, 5)
    clock.addChild(dayTrack.graphics)

    let numbersTrack = createOval(800 - 25, 0, 450 - 25, 0.8, 5)

    let bg = new Graphics()
    bg.beginFill(0xcccccc);
    bg.drawRect(0, 0, 1600, 900)

    game.rootContainer.addChild(bg)
    game.rootContainer.addChild(clock)

    dayTrack.graphics.addChild(sun)
    minuteTrack.graphics.addChild(oat)
    let textHolder = new Container()

    for (let i = 1; i <= 20; i++) {
        let text = new Text(20 - i, { fontFamily: "Roboto", fontSize: 50, fill: 0xff00ff })
        let p = Math.floor(i * numbersTrack.points.length / 20)
        if (i == 20) {
            p = numbersTrack.points.length - 1
        }
        text.position = subtractPoints(numbersTrack.points[p], multiplyPoint(new Point(text.width, text.height), 1))
        textHolder.addChild(text)
    }

    // textHolder.position = new Point(-600, -325)
    clock.addChild(textHolder)

    clock.addChild(digitalDisplay)
    clock.addChild(url)
}

// 20 hours in a day
// 20 minutes per hour
// 216 seconds per minute


export function update(dt: number) {
    let time = new Date()
    let totalSecondsInDay = time.getSeconds() + time.getMinutes() * 60 + time.getHours() * 60 * 60
    sun.position = dayTrack.points[dayTrack.points.length - Math.floor(totalSecondsInDay) % dayTrack.points.length - 1]
    let p = Math.floor((minuteTrack.points.length - (Math.floor((totalSecondsInDay % 216) / 216 * minuteTrack.points.length)) - 1) / 20)

    oat.position = minuteTrack.points[p]

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
    let trackPoints = drawRoundedCircle(outlineGraphics, radius, addedWidth, addedHeight, { color: 0x333333, width: lineWidth, alpha: 1 })

    return new Track(outlineGraphics, trackPoints)
}

export class Track {
    readonly graphics: Graphics;
    readonly points: IPointData[];
    constructor(graphics: Graphics, trackPoints: IPointData[]) {
        this.graphics = graphics
        this.points = trackPoints
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


    let tween = new TweenChain()
        // bottom edge, going left
        .add(new Tween(tweenableX, radius, xTravelDuration, EaseFunctions.linear))

        // bottom left corner
        .add(new MultiplexTween()
            .addChannel(new Tween(tweenableX, 0, 1, EaseFunctions.sineFastSlow))
            .addChannel(new Tween(tweenableY, totalHeight - radius, 1, EaseFunctions.sineSlowFast)))

        // left edge, going up
        .add(new Tween(tweenableY, radius, yTravelDuration, EaseFunctions.linear))

        // top left corner
        .add(new MultiplexTween()
            .addChannel(new Tween(tweenableX, radius, 1, EaseFunctions.sineSlowFast))
            .addChannel(new Tween(tweenableY, 0, 1, EaseFunctions.sineFastSlow)))

        // top edge, going right
        .add(new Tween(tweenableX, totalWidth - radius, xTravelDuration, EaseFunctions.linear))

        // top right corner
        .add(new MultiplexTween()
            .addChannel(new Tween(tweenableX, totalWidth, 1, EaseFunctions.sineFastSlow))
            .addChannel(new Tween(tweenableY, radius, 1, EaseFunctions.sineSlowFast)))

        // right edge, going down
        .add(new Tween(tweenableY, totalHeight - radius, yTravelDuration, EaseFunctions.linear))

        // bottom right corner
        .add(new MultiplexTween()
            .addChannel(new Tween(tweenableX, totalWidth - radius, 1, EaseFunctions.sineSlowFast))
            .addChannel(new Tween(tweenableY, totalHeight, 1, EaseFunctions.sineFastSlow)))

        // bottom edge, going left (closing the loop)
        .add(new Tween(tweenableX, startingX, xTravelDuration, EaseFunctions.linear))

    let increment = 1 / maxSecondsPerDay;

    let track = []
    graphics.moveTo(tweenableX.get(), tweenableY.get())
    while (!tween.isDone()) {
        tween.update(increment)
        graphics.lineTo(tweenableX.get(), tweenableY.get())
        track.push({ x: tweenableX.get(), y: tweenableY.get() })
    }
    return track
}