# M5Stack Unit Step16 MakeCode Extension
A MakeCode/PXT extension for the M5Stack Unit Step16 - a 16-position rotary encoder with 7-segment display and RGB LED.

## Features

- **Encoder Control**: Read 16-position encoder values and detect rotation changes
- **7-Segment Display**: Control brightness and display timeout settings
- **RGB LED**: Full color control with brightness adjustment
- **I2C Communication**: Simple register-based I2C interface
- **Event Handlers**: Real-time encoder change notifications

## Namespace

All functions are under the `m5step` namespace.

## API Reference

### Encoder Functions

- `getValue()` - Get current encoder position (0-15)
- `setDirection(clockwise: boolean)` - Set rotation direction (clockwise/counterclockwise)
- `getDirection(): boolean` - Get current rotation direction
- `onEncoderChange(handler)` - Register handler for encoder value changes with delta

### 7-Segment Display Functions

- `set7SegmentConfig(config: number)` - Configure display (0=off, 1-254=timeout in seconds, 255=always on)
- `get7SegmentConfig(): number` - Get current display configuration
- `set7SegmentBrightness(brightness: number)` - Set brightness (0-100)
- `get7SegmentBrightness(): number` - Get current brightness
- `set7SegmentState(on: boolean)` - Turn 7-segment display on/off

### LED Functions

- `setLedState(on: boolean)` - Turn LED on/off
- `setLedBrightness(brightness: number)` - Set LED brightness (0-100)
- `setLed(red, green, blue)` - Set LED color using RGB values (0-255)
- `setLedColor(color: number)` - Set LED color using hex color value
- `ledOff()` - Turn off LED completely

### Configuration Functions

- `save7SegmentConfig()` - Save 7-segment settings to flash (50ms)
- `saveLedConfig()` - Save LED settings to flash (50ms)
- `setDefaultConfig()` - Reset all settings to defaults
- `useAddress(address: number)` - Set custom I2C address (0-127)
- `getAddress(): number` - Get current I2C address
- `setAddress(address: number)` - Change and save new I2C address
- `getVersion(): number` - Get firmware version

## Default I2C Address

`0x48` (72 in decimal)

## Example Usage

```blocks
// Initialize and read encoder
let value = m5step.getValue()

// Set 7-segment display on and adjust brightness
m5step.set7SegmentState(true)
m5step.set7SegmentBrightness(75)

// Set LED color
m5step.setLedColor(0xFF0000)  // Red

// Handle encoder changes
m5step.onEncoderChange(function (value, delta) {
    basic.showNumber(value)
})
```

## License

MIT