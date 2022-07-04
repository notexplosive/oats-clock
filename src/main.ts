import { Graphics, Container, Point } from 'pixi.js';
import { game } from './limbo';
import { Tween, TweenChain, Tweenable, TweenableNumber, EaseFunction, EaseFunctions, MultiplexTween, CallbackTween } from './limbo/data/tween';

export function main() {
    let clock = new Container()
    clock.position = new Point(1600 / 2, 900 / 2)
    let graphics = new Graphics()
    graphics.clear();
    clock.addChild(graphics)

    let scale = 0.8
    let radius = 450 * scale
    let addedWidth = 250 * scale
    let addedHeight = 0 * scale

    let totalWidth = addedWidth + radius * 2
    let totalHeight = addedHeight + radius * 2
    graphics.position = new Point(-totalWidth / 2, -totalHeight / 2)
    drawRoundedCircle(graphics, radius, addedWidth, addedHeight)


    game.rootContainer.addChild(clock)
}

export function update(dt: number) {
}

function drawRoundedCircle(graphics: Graphics, radius: number, extraWidth: number, extraHeight: number) {

    graphics.lineStyle({ color: 0x00ff00, width: 10, alpha: 1 });


    let tweenableX = TweenableNumber.FromConstant(0)
    let tweenableY = TweenableNumber.FromConstant(radius)

    let totalWidth = radius + extraWidth
    let totalHeight = radius + extraHeight

    let tween = new TweenChain()
        .add(new MultiplexTween()
            .addChannel(new Tween(tweenableX, radius, 1, EaseFunctions.sineSlowFast))
            .addChannel(new Tween(tweenableY, 0, 1, EaseFunctions.sineFastSlow)))

        .add(new Tween(tweenableX, radius + totalWidth, 1, EaseFunctions.linear))

        .add(new MultiplexTween()
            .addChannel(new Tween(tweenableX, totalWidth + radius * 2, 1, EaseFunctions.sineFastSlow))
            .addChannel(new Tween(tweenableY, radius, 1, EaseFunctions.sineSlowFast)))

        .add(new Tween(tweenableY, totalHeight, 1, EaseFunctions.linear))

        .add(new MultiplexTween()
            .addChannel(new Tween(tweenableX, totalWidth + radius, 1, EaseFunctions.sineSlowFast))
            .addChannel(new Tween(tweenableY, totalHeight + radius, 1, EaseFunctions.sineFastSlow)))

        .add(new Tween(tweenableX, radius, 1, EaseFunctions.linear))

        .add(new MultiplexTween()
            .addChannel(new Tween(tweenableX, radius - radius, 1, EaseFunctions.sineFastSlow))
            .addChannel(new Tween(tweenableY, totalHeight, 1, EaseFunctions.sineSlowFast)))

        .add(new Tween(tweenableY, radius, 1, EaseFunctions.linear))
    //.add()

    let increment = 1 / 86400;


    graphics.moveTo(tweenableX.get(), tweenableY.get())
    while (!tween.isDone()) {
        tween.update(increment)
        graphics.lineTo(tweenableX.get(), tweenableY.get())
    }
}