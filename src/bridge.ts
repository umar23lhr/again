/**
 * SilenceX Logic Bridge
 * Handles communication between UI and Premiere Pro whether in-panel or standalone.
 */

class SilenceXBridge {
  private ws: WebSocket | null = null;
  private pendingEvals = new Map<string, (res: any) => void>();
  private isCEP = typeof window !== 'undefined' && !!(window as any).__adobe_cep__;

  constructor() {
    if (!this.isCEP) {
      this.initWebSocket();
    } else {
      console.log("Running inside Premiere Pro CEP Environment");
      this.initHostListener();
    }
  }

  private initWebSocket() {
    try {
      // Robust protocol detection: Replace 'http' with 'ws' (handles http -> ws and https -> wss)
      const protocol = window.location.protocol.startsWith('https') ? 'wss:' : 'ws:';
      const host = window.location.host || 'localhost:3000';
      const wsUrl = `${protocol}//${host}`;
      
      console.log(`[SilenceX] Initializing UI Bridge: ${wsUrl}`);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("Connected to SilenceX Server Bridge");
        this.ws?.send(JSON.stringify({ type: 'register-client' }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'result' && this.pendingEvals.has(data.id)) {
            this.pendingEvals.get(data.id)?.(data.data);
            this.pendingEvals.delete(data.id);
          }
        } catch (e) {
          console.error("Failed to parse bridge message:", e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn("WebSocket Bridge Error (Likely server not running):", err);
      };
    } catch (e) {
      console.error("Failed to initialize WebSocket:", e);
    }
  }

  private initHostListener() {
    try {
      const protocol = window.location.protocol.startsWith('https') ? 'wss:' : 'ws:';
      const host = window.location.host || 'localhost:3000';
      const wsUrl = `${protocol}//${host}`;
      
      console.log(`[SilenceX] Initializing Host Bridge: ${wsUrl}`);
      const hostWs = new WebSocket(wsUrl);
      
      hostWs.onopen = () => {
        hostWs.send(JSON.stringify({ type: 'register-host' }));
      };

      hostWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'eval') {
            if (typeof (window as any).CSInterface === 'function' || typeof (window as any).CSInterface === 'object') {
              const cs = new (window as any).CSInterface();
              cs.evalScript(data.script, (res: any) => {
                if (hostWs.readyState === WebSocket.OPEN) {
                  hostWs.send(JSON.stringify({ type: 'eval-result', data: res, id: data.id }));
                }
              });
            } else {
              console.warn("CSInterface not found in host environment");
            }
          }
        } catch (e) {
          console.error("Failed to parse host bridge message:", e);
        }
      };

      hostWs.onerror = (err) => {
        console.warn("Host WebSocket Error:", err);
      };
    } catch (e) {
      console.error("Failed to initialize Host Listener:", e);
    }
  }

  public evalScript(script: string, callback: (res: any) => void) {
    if (this.isCEP) {
      if (typeof (window as any).CSInterface === 'function' || typeof (window as any).CSInterface === 'object') {
        try {
          const cs = new (window as any).CSInterface();
          cs.evalScript(script, callback);
        } catch (e) {
          console.error("CEP Eval Error:", e);
          callback(null);
        }
      } else {
        console.warn("CEP detected but CSInterface missing, simulating...");
        setTimeout(() => callback("simulation-ok"), 500);
      }
    } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Remote execution
      const id = Math.random().toString(36).substring(7);
      this.pendingEvals.set(id, callback);
      this.ws.send(JSON.stringify({ type: 'eval', script, id }));
    } else {
      console.warn("Bridge not available, simulating response");
      setTimeout(() => callback("simulation-ok"), 500);
    }
  }
}

export const bridge = new SilenceXBridge();
