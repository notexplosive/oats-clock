import { Graphics, Container, Point, ILineStyleOptions } from 'pixi.js';
import { game } from './limbo';
import { Tween, TweenChain, Tweenable, TweenableNumber, EaseFunction, EaseFunctions, MultiplexTween, CallbackTween } from './limbo/data/tween';

export function main() {
    let clock = new Container()
    clock.position = new Point(1600 / 2, 900 / 2)
    let outlineGraphics = new Graphics()
    outlineGraphics.clear();
    clock.addChild(outlineGraphics)

    let scale = 0.8
    let radius = 450 * scale
    let addedWidth = 800 * scale
    let addedHeight = 0 * scale

    let totalWidth = addedWidth + radius * 2
    let totalHeight = addedHeight + radius * 2
    outlineGraphics.position = new Point(-totalWidth / 2, -totalHeight / 2)
    drawRoundedCircle(outlineGraphics, radius, addedWidth, addedHeight, { color: 0x333333, width: 20, alpha: 1 })

    let bg = new Graphics()
    bg.beginFill(0xcccccc);
    bg.drawRect(0, 0, 1600, 900)

    game.rootContainer.addChild(bg)
    game.rootContainer.addChild(clock)
}

export function update(dt: number) {
}

function drawRoundedCircle(graphics: Graphics, radius: number, extraWidth: number, extraHeight: number, lineStyle: ILineStyleOptions) {

    graphics.lineStyle(lineStyle);


    let tweenableX = TweenableNumber.FromConstant(0)
    let tweenableY = TweenableNumber.FromConstant(radius)

    let totalWidth = radius * 2 + extraWidth
    let totalHeight = radius * 2 + extraHeight

    let tween = new TweenChain()
        .add(new MultiplexTween()
            .addChannel(new Tween(tweenableX, radius, 1, EaseFunctions.sineSlowFast))
            .addChannel(new Tween(tweenableY, 0, 1, EaseFunctions.sineFastSlow)))

        .add(new Tween(tweenableX, totalWidth - radius, 1, EaseFunctions.linear))

        .add(new MultiplexTween()
            .addChannel(new Tween(tweenableX, totalWidth, 1, EaseFunctions.sineFastSlow))
            .addChannel(new Tween(tweenableY, radius, 1, EaseFunctions.sineSlowFast)))

        .add(new Tween(tweenableY, totalHeight - radius, 1, EaseFunctions.linear))

        .add(new MultiplexTween()
            .addChannel(new Tween(tweenableX, totalWidth - radius, 1, EaseFunctions.sineSlowFast))
            .addChannel(new Tween(tweenableY, totalHeight, 1, EaseFunctions.sineFastSlow)))

        .add(new Tween(tweenableX, radius, 1, EaseFunctions.linear))

        .add(new MultiplexTween()
            .addChannel(new Tween(tweenableX, 0, 1, EaseFunctions.sineFastSlow))
            .addChannel(new Tween(tweenableY, totalHeight - radius, 1, EaseFunctions.sineSlowFast)))

        .add(new Tween(tweenableY, radius, 1, EaseFunctions.linear))
    //.add()

    let increment = 1 / 86400;


    graphics.moveTo(tweenableX.get(), tweenableY.get())
    while (!tween.isDone()) {
        tween.update(increment)
        graphics.lineTo(tweenableX.get(), tweenableY.get())
    }
}