# Smart Download Router 🚀

An intelligent Chrome Extension (Manifest V3) that automatically organizes your downloaded files into specific subfolders based on highly customizable rules. 

Built specifically to help developers, and engineering/CSE students keep their downloads folders completely clean without lifting a finger!

## ✨ Features

- **Deep Metadata Routing**: Checks the `tabUrl`, `referrer`, and `url` of every download to accurately capture origin URLs even for hidden or Blob downloads (like those from WhatsApp Web).
- **Multiple Condition Types**:
  - **URL & Keyword Matching**: Route downloads based on the website they originated from. Supports grouped inputs (e.g., `github.com, stackoverflow.com` → `Code`).
  - **File Type Matching**: Route downloads based entirely on their file extensions (e.g., `pdf, docx, txt` → `Documents`).
- **Drag & Drop Priority Sorting**: Easily reorder your Active Rules. The routing engine checks rules from top-to-bottom, giving you total control over edge cases and priorities.
- **CSE Smart Defaults Gallery**: Instantly populate your setup with a gallery of curated defaults tailored specifically for computer science students (Videos, Code, Installers, Archives, Images, etc.). You can independently add or dismiss suggestions!
- **Premium UI**: A beautifully crafted, modern dark-mode settings interface utilizing pure Vanilla CSS. No clunky frameworks!

## 📦 Installation

This extension can be run directly from your local filesystem.

1. Clone or download this repository to a permanent location on your drive (e.g., `D:\Project\Extensions\Download Router`).
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Toggle on **Developer mode** in the top right corner.
4. Click **Load unpacked** in the top left.
5. Select the `Download Router` folder.
6. Make sure to **Pin** the extension to your toolbar for easy access to the Settings menu!

## ⚠️ Important Note on File Destinations

Due to strict security limitations in the Chrome Extensions API, **extensions are only allowed to save files *inside* your browser's default download folder.** 

- If your Chrome default download folder is currently set to `D:\Downloads`, a destination rule for `WhatsApp` will securely save the file to `D:\Downloads\WhatsApp`.
- You **cannot** route files to completely detached absolute paths (like `C:\SecretFolder`) unless you explicitly change your browser's primary default download location to `C:\` first. 
- *To prevent crashes, the extension will automatically sanitize any accidental absolute paths typed into the destination folder input.*

## 🛠️ Under the Hood

- **Manifest V3**
- **Vanilla JavaScript (ES6)**
- **HTML5 / CSS3**
- Extensively uses the asynchronous `chrome.downloads.onDeterminingFilename` and `chrome.storage.local` APIs.