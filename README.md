# Meeting Assistant Chrome Extension

A Chrome extension that provides real-time AI-powered assistance during Google Meet sessions by analyzing captions and generating relevant responses through the Anthropic Claude API.

## Features

- Real-time caption monitoring in Google Meet sessions
- Automatic question detection and processing
- AI-powered responses using Claude API
- Elegant, non-intrusive UI with floating answer display
- Debug mode for troubleshooting
- Configurable API settings

## Installation

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. Configure your Anthropic API key in the extension settings

## Configuration

1. Click the extension icon in Chrome's toolbar
2. Click "API Settings" to open the configuration page
3. Enter your Anthropic API key
4. Click "Save Settings"

The extension will validate your API key before saving to ensure it works correctly.

## Usage

1. Join a Google Meet session
2. Ensure captions are enabled in the meeting
3. The extension will automatically monitor captions
4. When a question is detected, the extension will:
   - Process the question through Claude API
   - Display the answer in a floating window
   - Automatically remove the answer after 30 seconds

## Technical Details

### Components

- `background.js`: Handles API communication and message routing
- `content.js`: Manages caption monitoring and UI updates
- `options.js`: Handles settings management
- `popup.js`: Controls the extension popup interface

### Key Features

- Debounced caption processing to handle streaming text efficiently
- Queue-based answer processing to manage multiple questions
- Error handling and retry logic for API communication
- Debug logging system for troubleshooting
- Automatic cleanup of old answers

### API Integration

The extension uses the Anthropic Claude API with the following configuration:
- Model: claude-3-sonnet-20240229
- Max tokens: 600
- Content type: JSON
- API version: 2023-06-01

## Development

### Prerequisites

- Chrome browser
- Anthropic API key
- Basic understanding of Chrome extension development

### Local Development

1. Make changes to the source code
2. Reload the extension in Chrome's extensions page
3. Test in a Google Meet session with captions enabled

### Debug Mode

Set `DEBUG_MODE = true` in content.js to enable the debug overlay showing real-time logs.

## Security Notes

- API keys are stored securely using Chrome's storage sync API
- The extension only activates on meet.google.com domains
- All communication with the Anthropic API is encrypted

## Limitations

- Requires enabled captions in Google Meet
- Depends on Google Meet's caption DOM structure
- Limited to processing text-based questions
- Maximum response time of 30 seconds per answer

## Support

For issues or feature requests, please submit an issue in the repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
