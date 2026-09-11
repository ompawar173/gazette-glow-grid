# Prevent uploaded images from breaking article layouts

## Changes
- Strengthen the shared article image rules so every uploaded image stays within its content column.
- Apply responsive maximum width and height limits while preserving each image’s aspect ratio.
- Use `object-fit: contain` for article-body images and a controlled crop for featured images.
- Add overflow protection for legacy rich-text image markup and mobile screens.

## Validation
- Open an article at desktop and mobile sizes and confirm oversized portrait and landscape images remain contained without distortion or horizontal overflow.
