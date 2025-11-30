/**
 * Styles for MinimalAutofillPanel
 * Extracted to reduce main component size
 */

export function getPanelStyles(panelSize: { width: number; height: number }, isMinimized: boolean) {
  return `
    @keyframes minimizePanel {
      0% {
        height: ${panelSize.height}px;
        opacity: 1;
      }
      100% {
        height: 0;
        opacity: 0;
      }
    }

    @keyframes maximizePanel {
      0% {
        height: 0;
        opacity: 0;
      }
      100% {
        height: ${panelSize.height}px;
        opacity: 1;
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .minimal-panel-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .minimal-panel-header {
      background: linear-gradient(135deg, #0077B5 0%, #005582 100%);
      color: white;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: move !important;
      user-select: none !important;
      position: relative;
      z-index: 1;
    }

    .minimal-panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
    }

    .minimal-panel-controls {
      display: flex;
      gap: 8px;
    }

    .minimal-panel-button {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 6px;
      padding: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .minimal-panel-button:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .minimal-panel-content {
      flex: 1;
      overflow-y: auto;
      ${isMinimized ? 'display: none;' : ''}
    }

    /* Resize handle styles - Override react-rnd defaults */
    .react-resizable-handle {
      position: absolute !important;
      z-index: 2147483648 !important;
      background-color: transparent !important;
      pointer-events: auto !important;
      touch-action: none !important;
    }

    /* Corner handles - 20x20px clickable areas */
    .react-resizable-handle-se {
      bottom: 0 !important;
      right: 0 !important;
      width: 20px !important;
      height: 20px !important;
      cursor: se-resize !important;
    }

    .react-resizable-handle-sw {
      bottom: 0 !important;
      left: 0 !important;
      width: 20px !important;
      height: 20px !important;
      cursor: sw-resize !important;
    }

    .react-resizable-handle-ne {
      top: 0 !important;
      right: 0 !important;
      width: 20px !important;
      height: 20px !important;
      cursor: ne-resize !important;
    }

    .react-resizable-handle-nw {
      top: 0 !important;
      left: 0 !important;
      width: 20px !important;
      height: 20px !important;
      cursor: nw-resize !important;
    }

    /* Edge handles - 12px wide strips for better clickability */
    .react-resizable-handle-e {
      right: 0 !important;
      top: 0 !important;
      bottom: 0 !important;
      width: 12px !important;
      cursor: e-resize !important;
    }

    .react-resizable-handle-w {
      left: 0 !important;
      top: 0 !important;
      bottom: 0 !important;
      width: 12px !important;
      cursor: w-resize !important;
    }

    .react-resizable-handle-n {
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      height: 12px !important;
      cursor: n-resize !important;
    }

    .react-resizable-handle-s {
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      height: 12px !important;
      cursor: s-resize !important;
    }

    /* Visual indicators for corner handles */
    .react-resizable-handle-se::after,
    .react-resizable-handle-sw::after,
    .react-resizable-handle-ne::after,
    .react-resizable-handle-nw::after {
      content: '';
      position: absolute;
      width: 10px;
      height: 10px;
      border-style: solid;
      border-color: rgba(0, 119, 181, 0.4);
      border-width: 2px;
      filter: drop-shadow(0 0 2px rgba(0, 119, 181, 0.6));
    }

    .react-resizable-handle-se::after {
      bottom: 4px;
      right: 4px;
      border-top: none;
      border-left: none;
    }

    .react-resizable-handle-sw::after {
      bottom: 4px;
      left: 4px;
      border-top: none;
      border-right: none;
    }

    .react-resizable-handle-ne::after {
      top: 4px;
      right: 4px;
      border-bottom: none;
      border-left: none;
    }

    .react-resizable-handle-nw::after {
      top: 4px;
      left: 4px;
      border-bottom: none;
      border-right: none;
    }

    /* Shared styles for both Job Description and Questions sections */
    .generate-section-container {
      padding: 20px;
    }

    .generate-section-header {
      margin-bottom: 20px;
    }

    .generate-section-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .generate-section-title {
      fontSize: 16px;
      font-weight: 600;
      color: #1d1d1f;
      margin: 0;
    }

    .generate-section-description {
      font-size: 13px;
      color: #6e6e73;
      margin: 0;
      line-height: 1.5;
    }

    .generate-form-group {
      margin-bottom: 16px;
    }

    .generate-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #1d1d1f;
      margin-bottom: 8px;
    }

    .generate-textarea,
    .generate-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #d2d2d7;
      border-radius: 8px;
      fontSize: 13px;
      font-family: inherit;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }

    .generate-textarea:focus,
    .generate-input:focus {
      outline: none;
      border-color: #0077B5;
    }

    .generate-textarea {
      min-height: 120px;
      resize: vertical;
    }

    .generate-button-primary {
      width: 100%;
      padding: 12px 16px;
      background: linear-gradient(135deg, #0077B5 0%, #005582 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: opacity 0.2s;
    }

    .generate-button-primary:hover:not(:disabled) {
      opacity: 0.9;
    }

    .generate-button-primary:disabled {
      background: #d2d2d7;
      cursor: not-allowed;
    }

    .generate-answer-box {
      padding: 16px;
      background-color: #f5f5f7;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .generate-answer-title {
      font-size: 14px;
      font-weight: 600;
      color: #1d1d1f;
      margin: 0 0 12px 0;
    }

    .generate-answer-text {
      font-size: 13px;
      color: #1d1d1f;
      line-height: 1.6;
      margin: 0;
      white-space: pre-wrap;
    }

    .generate-button-group {
      display: flex;
      gap: 12px;
    }

    .generate-button-secondary {
      flex: 1;
      padding: 12px 16px;
      background: white;
      color: #0077B5;
      border: 1px solid #0077B5;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .generate-button-secondary:hover {
      background-color: #f5f5f7;
    }

    .generate-error-box {
      padding: 12px 16px;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .generate-error-text {
      font-size: 13px;
      color: #dc2626;
      margin: 0;
    }

    /* Fill Form Button */
    .fill-form-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.95);
      color: #0077B5;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .fill-form-button:hover:not(:disabled) {
      background: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .fill-form-button:disabled {
      background: rgba(255, 255, 255, 0.5);
      color: rgba(0, 119, 181, 0.5);
      cursor: not-allowed;
    }

    .fill-form-text {
      display: inline-block;
    }

    .fill-form-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid #0077B5;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  `;
}
