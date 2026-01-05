m5step.onEncoderChange(function (value, delta) {
    serial.writeLine("v: " + value + ", d: " + delta)
})
m5step.setDirection(false)
m5step.set7SegmentBrightness(100)
m5step.setLedBrightness(100)
m5step.setLedColor(0x00ffff)
