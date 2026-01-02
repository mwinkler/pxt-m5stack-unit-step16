//% color="#0079B9" icon="\uf021" block="M5 Step16"
namespace m5step {
    // I2C address and registers
    const STEP16_DEFAULT_ADDR = 0x48;
    const VALUE_REG = 0x00;
    const LED_CONFIG_REG = 0x10;
    const LED_BRIGHTNESS_REG = 0x20;
    const SWITCH_REG = 0x30;
    const RGB_CONFIG_REG = 0x40;
    const RGB_BRIGHTNESS_REG = 0x41;
    const RGB_VALUE_REG = 0x50;
    const R_VALUE_REG = 0x50;
    const G_VALUE_REG = 0x51;
    const B_VALUE_REG = 0x52;
    const SAVE_FLASH_REG = 0xF0;
    const VERSION_REG = 0xFE;
    const ADDRESS_REG = 0xFF;

    // Configuration constants
    const LED_CONFIG_OFF = 0x00;
    const LED_CONFIG_ON = 0xFF;
    const LED_CONFIG_DEFAULT = 0xFE;
    const SWITCH_CLOCKWISE = 0x01;
    const SWITCH_COUNTERCLOCKWISE = 0x00;
    const RGB_CONFIG_OFF = 0x00;
    const RGB_CONFIG_ON = 0x01;
    const SAVE_LED_CONFIG = 0x01;
    const SAVE_RGB_CONFIG = 0x02;

    let _addr: number = STEP16_DEFAULT_ADDR;
    let _previousEncoderValue: number = 0;
    let _onEncoderChangeHandler: (value: number, delta: number) => void = null;
    let _controlLoopStarted: boolean = false;

    /**
     * Write a byte to a register
     */
    function writeReg(reg: number, value: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = value;
        pins.i2cWriteBuffer(_addr, buf);
    }

    /**
     * Write multiple bytes to a register
     */
    function writeBytes(reg: number, data: Buffer): void {
        let buf = pins.createBuffer(data.length + 1);
        buf[0] = reg;
        for (let i = 0; i < data.length; i++) {
            buf[i + 1] = data[i];
        }
        pins.i2cWriteBuffer(_addr, buf);
    }

    /**
     * Read bytes from a register
     */
    function readBytes(reg: number, length: number): Buffer {
        pins.i2cWriteNumber(_addr, reg, NumberFormat.UInt8BE);
        return pins.i2cReadBuffer(_addr, length);
    }

    /**
     * Start the background control loop for encoder events
     */
    function startControlLoop(): void {
        if (_controlLoopStarted) {
            return;
        }
        _controlLoopStarted = true;
        control.inBackground(() => {
            while (true) {
                let currentEncoderValue = getValue();
                if (currentEncoderValue != _previousEncoderValue) {
                    let delta = currentEncoderValue - _previousEncoderValue;
                    _previousEncoderValue = currentEncoderValue;
                    if (_onEncoderChangeHandler) {
                        _onEncoderChangeHandler(currentEncoderValue, delta);
                    }
                }
                basic.pause(50);
            }
        });
    }

    /**
     * Get the current encoder value (0-15)
     * @return encoder value as 0x0-0xF
     */
    //% blockId=m5step_get_value
    //% block="encoder value"
    //% group="Encoder"
    //% weight=100
    //% blockGap=8
    export function getValue(): number {
        let buf = readBytes(VALUE_REG, 1);
        return buf[0];
    }

    /**
     * Controls the operating status of the indicator light, allowing it to be set to always on, always off, or turn off after a specified time.
     * @param config LED configuration (0=off, 1-254=timeout in seconds, 255=always on)
     */
    //% blockId=m5step_set_led_config
    //% block="set LED config $config"
    //% config.min=0 config.max=255 config.defl=254
    //% group="LED"
    //% weight=90
    //% blockGap=8
    //% advanced=true
    export function setLedConfig(config: number): void {
        writeReg(LED_CONFIG_REG, config);
    }

    /**
     * Get current LED configuration
     * @return LED configuration value
     */
    //% blockId=m5step_get_led_config
    //% block="LED config"
    //% group="LED"
    //% weight=88
    //% blockGap=8
    //% advanced=true
    export function getLedConfig(): number {
        let buf = readBytes(LED_CONFIG_REG, 1);
        return buf[0];
    }

    /**
     * Set LED brightness
     * @param brightness LED brightness (0-100)
     */
    //% blockId=m5step_set_led_brightness
    //% block="set LED brightness $brightness"
    //% brightness.min=0 brightness.max=100 brightness.defl=50
    //% group="LED"
    //% weight=85
    //% blockGap=8
    export function setLedBrightness(brightness: number): void {
        if (brightness > 100) brightness = 100;
        if (brightness < 0) brightness = 0;
        writeReg(LED_BRIGHTNESS_REG, brightness);
    }

    /**
     * Get current LED brightness
     * @return LED brightness (0-100)
     */
    //% blockId=m5step_get_led_brightness
    //% block="LED brightness"
    //% group="LED"
    //% weight=83
    //% blockGap=8
    export function getLedBrightness(): number {
        let buf = readBytes(LED_BRIGHTNESS_REG, 1);
        return buf[0];
    }

    /**
     * Turn LED on (always on)
     */
    //% blockId=m5step_led_on
    //% block="turn LED on"
    //% group="LED"
    //% weight=80
    //% blockGap=8
    export function ledOn(): void {
        setLedConfig(LED_CONFIG_ON);
    }

    /**
     * Turn LED off
     */
    //% blockId=m5step_led_off
    //% block="turn LED off"
    //% group="LED"
    //% weight=78
    //% blockGap=8
    export function ledOff(): void {
        setLedConfig(LED_CONFIG_OFF);
    }

    /**
     * Set encoder rotation direction
     * @param clockwise true for clockwise, false for counterclockwise
     */
    //% blockId=m5step_set_direction
    //% block="set direction clockwise $clockwise"
    //% clockwise.shadow="toggleOnOff" clockwise.defl=true
    //% group="Encoder"
    //% weight=75
    //% blockGap=8
    export function setDirection(clockwise: boolean): void {
        writeReg(SWITCH_REG, clockwise ? SWITCH_CLOCKWISE : SWITCH_COUNTERCLOCKWISE);
    }

    /**
     * Get encoder rotation direction
     * @return true if clockwise, false if counterclockwise
     */
    //% blockId=m5step_get_direction
    //% block="direction clockwise"
    //% group="Encoder"
    //% weight=73
    //% blockGap=8
    export function getDirection(): boolean {
        let buf = readBytes(SWITCH_REG, 1);
        return buf[0] == SWITCH_CLOCKWISE;
    }

    /**
     * Set RGB LED on/off state
     * @param on true to turn on, false to turn off
     */
    //% blockId=m5step_set_rgb_state
    //% block="turn RGB $on"
    //% on.shadow="toggleOnOff" on.defl=true
    //% group="RGB"
    //% weight=70
    //% blockGap=8
    export function setRgbState(on: boolean): void {
        writeReg(RGB_CONFIG_REG, on ? RGB_CONFIG_ON : RGB_CONFIG_OFF);
    }

    /**
     * Get RGB LED on/off state
     * @return true if on, false if off
     */
    //% blockId=m5step_get_rgb_state
    //% block="RGB on"
    //% group="RGB"
    //% weight=68
    //% blockGap=8
    export function getRgbState(): boolean {
        let buf = readBytes(RGB_CONFIG_REG, 1);
        return buf[0] == RGB_CONFIG_ON;
    }

    /**
     * Set RGB LED brightness
     * @param brightness RGB brightness (0-100)
     */
    //% blockId=m5step_set_rgb_brightness
    //% block="set RGB brightness $brightness"
    //% brightness.min=0 brightness.max=100 brightness.defl=50
    //% group="RGB"
    //% weight=65
    //% blockGap=8
    export function setRgbBrightness(brightness: number): void {
        if (brightness > 100) brightness = 100;
        if (brightness < 0) brightness = 0;
        writeReg(RGB_BRIGHTNESS_REG, brightness);
    }

    /**
     * Get current RGB brightness
     * @return RGB brightness (0-100)
     */
    //% blockId=m5step_get_rgb_brightness
    //% block="RGB brightness"
    //% group="RGB"
    //% weight=63
    //% blockGap=8
    export function getRgbBrightness(): number {
        let buf = readBytes(RGB_BRIGHTNESS_REG, 1);
        return buf[0];
    }

    /**
     * Set RGB LED color
     * @param red Red value (0-255)
     * @param green Green value (0-255)
     * @param blue Blue value (0-255)
     */
    //% blockId=m5step_set_rgb
    //% block="set RGB red $red green $green blue $blue"
    //% red.min=0 red.max=255 red.defl=255
    //% green.min=0 green.max=255 green.defl=0
    //% blue.min=0 blue.max=255 blue.defl=0
    //% group="RGB"
    //% weight=60
    //% blockGap=8
    export function setRgb(red: number, green: number, blue: number): void {
        let data = pins.createBuffer(3);
        data[0] = red & 0xFF;
        data[1] = green & 0xFF;
        data[2] = blue & 0xFF;
        writeBytes(RGB_VALUE_REG, data);
    }

    /**
     * Set RGB LED color using a color value
     * @param color RGB color value (0x000000 to 0xFFFFFF)
     */
    //% blockId=m5step_set_rgb_color
    //% block="set RGB color $color"
    //% color.shadow="colorNumberPicker"
    //% group="RGB"
    //% weight=58
    //% blockGap=8
    export function setRgbColor(color: number): void {
        let r = (color >> 16) & 0xFF;
        let g = (color >> 8) & 0xFF;
        let b = color & 0xFF;
        setRgb(r, g, b);
    }

    /**
     * Turn off RGB LED
     */
    //% blockId=m5step_rgb_off
    //% block="turn RGB off"
    //% group="RGB"
    //% weight=55
    //% blockGap=8
    export function rgbOff(): void {
        setRgb(0, 0, 0);
    }

    /**
     * Save LED configuration to flash memory
     * Takes about 50ms to complete
     */
    //% blockId=m5step_save_led_config
    //% block="save LED config to flash"
    //% group="Configuration"
    //% weight=35
    //% blockGap=8
    //% advanced=true
    export function saveLedConfig(): void {
        writeReg(SAVE_FLASH_REG, SAVE_LED_CONFIG);
        basic.pause(50);
    }

    /**
     * Save RGB configuration to flash memory
     * Takes about 50ms to complete
     */
    //% blockId=m5step_save_rgb_config
    //% block="save RGB config to flash"
    //% group="Configuration"
    //% weight=33
    //% blockGap=8
    //% advanced=true
    export function saveRgbConfig(): void {
        writeReg(SAVE_FLASH_REG, SAVE_RGB_CONFIG);
        basic.pause(50);
    }

    /**
     * Reset all settings to default values
     * LED=0xFE, LED brightness=50, Switch=clockwise, RGB=on, RGB brightness=50, RGB color=black
     */
    //% blockId=m5step_set_default_config
    //% block="reset to default settings"
    //% group="Configuration"
    //% weight=24
    //% blockGap=8
    //% advanced=true
    export function setDefaultConfig(): void {
        setLedConfig(LED_CONFIG_DEFAULT);
        setLedBrightness(50);
        setDirection(true);
        setRgbState(true);
        setRgbBrightness(50);
        setRgb(0, 0, 0);
        saveLedConfig();
        saveRgbConfig();
    }

    /**
     * Register handler for encoder value changes
     * @param handler code to run when encoder value changes, receives current value and delta
     */
    //% blockId=m5step_on_encoder_change
    //% block="on encoder value $value delta $delta"
    //% group="Encoder"
    //% draggableParameters="reporter"
    //% weight=20
    //% blockGap=8
    export function onEncoderChange(handler: (value: number, delta: number) => void): void {
        _onEncoderChangeHandler = handler;
        _previousEncoderValue = getValue();
        startControlLoop();
    }

    /**
     * Set custom I2C address for the device (use before any other operation)
     * @param address I2C address to use
     */
    //% blockId=m5step_use_address
    //% block="use I2C address $address"
    //% address.min=0 address.max=127 address.defl=72
    //% group="Configuration"
    //% weight=15
    //% blockGap=8
    //% advanced=true
    export function useAddress(address: number): void {
        _addr = address;
    }
}
