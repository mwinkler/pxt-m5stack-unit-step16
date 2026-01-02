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
     * @param config 7 segment configuration (0=off, 1-254=timeout in seconds, 255=always on)
     */
    //% blockId=m5step_set_7segment_config
    //% block="set 7 segment config $config"
    //% config.min=0 config.max=255 config.defl=254
    //% group="7 Segment Display"
    //% weight=90
    //% blockGap=8
    //% advanced=true
    export function set7SegmentConfig(config: number): void {
        writeReg(LED_CONFIG_REG, config);
    }

    /**
     * Get current 7 segment configuration
     * @return 7 segment configuration value
     */
    //% blockId=m5step_get_7segment_config
    //% block="7 segment config"
    //% group="7 Segment Display"
    //% weight=88
    //% blockGap=8
    //% advanced=true
    export function get7SegmentConfig(): number {
        let buf = readBytes(LED_CONFIG_REG, 1);
        return buf[0];
    }

    /**
     * Set 7 segment brightness
     * @param brightness 7 segment brightness (0-100)
     */
    //% blockId=m5step_set_7segment_brightness
    //% block="set 7 segment brightness $brightness"
    //% brightness.min=0 brightness.max=100 brightness.defl=50
    //% group="7 Segment Display"
    //% weight=85
    //% blockGap=8
    export function set7SegmentBrightness(brightness: number): void {
        if (brightness > 100) brightness = 100;
        if (brightness < 0) brightness = 0;
        writeReg(LED_BRIGHTNESS_REG, brightness);
    }

    /**
     * Turn 7 segment on/off
     * @param on true to turn on, false to turn off
     */
    //% blockId=m5step_set_7segment_state
    //% block="turn 7 segment $on"
    //% on.shadow="toggleOnOff" on.defl=true
    //% group="7 Segment Display"
    //% weight=80
    //% blockGap=8
    export function set7SegmentState(on: boolean): void {
        set7SegmentConfig(on ? LED_CONFIG_ON : LED_CONFIG_OFF);
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
     * Set LED on/off state
     * @param on true to turn on, false to turn off
     */
    //% blockId=m5step_set_led_state
    //% block="turn LED $on"
    //% on.shadow="toggleOnOff" on.defl=true
    //% group="LED"
    //% weight=70
    //% blockGap=8
    export function setLedState(on: boolean): void {
        writeReg(RGB_CONFIG_REG, on ? RGB_CONFIG_ON : RGB_CONFIG_OFF);
    }

    /**
     * Set LED brightness
     * @param brightness LED brightness (0-100)
     */
    //% blockId=m5step_set_led_brightness
    //% block="set LED brightness $brightness"
    //% brightness.min=0 brightness.max=100 brightness.defl=50
    //% group="LED"
    //% weight=65
    //% blockGap=8
    export function setLedBrightness(brightness: number): void {
        if (brightness > 100) brightness = 100;
        if (brightness < 0) brightness = 0;
        writeReg(RGB_BRIGHTNESS_REG, brightness);
    }

    /**
     * Set LED color
     * @param red Red value (0-255)
     * @param green Green value (0-255)
     * @param blue Blue value (0-255)
     */
    //% blockId=m5step_set_led
    //% block="set LED red $red green $green blue $blue"
    //% red.min=0 red.max=255 red.defl=255
    //% green.min=0 green.max=255 green.defl=0
    //% blue.min=0 blue.max=255 blue.defl=0
    //% group="LED"
    //% weight=60
    //% blockGap=8
    export function setLed(red: number, green: number, blue: number): void {
        let data = pins.createBuffer(3);
        data[0] = red & 0xFF;
        data[1] = green & 0xFF;
        data[2] = blue & 0xFF;
        writeBytes(RGB_VALUE_REG, data);
    }

    /**
     * Set LED color using a color value
     * @param color LED color value (0x000000 to 0xFFFFFF)
     */
    //% blockId=m5step_set_led_color
    //% block="set LED color $color"
    //% color.shadow="colorNumberPicker"
    //% group="LED"
    //% weight=58
    //% blockGap=8
    export function setLedColor(color: number): void {
        let r = (color >> 16) & 0xFF;
        let g = (color >> 8) & 0xFF;
        let b = color & 0xFF;
        setLed(r, g, b);
    }

    /**
     * Save 7 segment configuration to flash memory
     * Takes about 50ms to complete
     */
    //% blockId=m5step_save_7segment_config
    //% block="save 7 segment config to flash"
    //% group="Configuration"
    //% weight=35
    //% blockGap=8
    //% advanced=true
    export function save7SegmentConfig(): void {
        writeReg(SAVE_FLASH_REG, SAVE_LED_CONFIG);
        basic.pause(50);
    }

    /**
     * Save LED configuration to flash memory
     * Takes about 50ms to complete
     */
    //% blockId=m5step_save_led_config
    //% block="save LED config to flash"
    //% group="Configuration"
    //% weight=33
    //% blockGap=8
    //% advanced=true
    export function saveLedConfig(): void {
        writeReg(SAVE_FLASH_REG, SAVE_RGB_CONFIG);
        basic.pause(50);
    }

    /**
     * Reset all settings to default values
     * 7 segment=0xFE, 7 segment brightness=50, Switch=clockwise, LED=on, LED brightness=50, LED color=black
     */
    //% blockId=m5step_set_default_config
    //% block="reset to default settings"
    //% group="Configuration"
    //% weight=24
    //% blockGap=8
    //% advanced=true
    export function setDefaultConfig(): void {
        set7SegmentConfig(LED_CONFIG_DEFAULT);
        set7SegmentBrightness(50);
        setDirection(true);
        setLedState(true);
        setLedBrightness(50);
        setLed(0, 0, 0);
        save7SegmentConfig();
        saveLedConfig();
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
