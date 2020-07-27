// https://tools.ietf.org/html/rfc8441

import {WebSocketMultiplex, Channel} from "./multiplex";
import SockJS from "sockjs-client";

class QueueClient {
    constructor(server) {
        this.server = server;
    }

    server;
    channels;
    sock: SockJS;
    multiplexer: WebSocketMultiplex;

    retries = 0;
    opened = false;

    connect() {
        if (this.opened) return;
        const sock: SockJS = new SockJS(this.server);
        sock.onopen = () => {
            console.log('connection opened');
            this.opened = true;
            this.retries = 0;
        };
        sock.onclose = (e) => {
            console.log(`connection closed: ${e.reason} (${e.code})`);
            this.opened = false;
            delete this.sock;
            delete this.multiplexer;
            if (e.code !== 1000)
                if ((this.retries++) < 3) {
                    console.log('reconnecting');
                    console.log(`retry ${this.retries}`);
                    this.connect()
                }

        };

        this.sock = sock;
        this.multiplexer = new WebSocketMultiplex(this.sock);
        this.channels = {};
    }

    disconnect() {
        this.sock?.close();
        this.channels = {};
    }

    subscribe(topic, receive) {
        if (!this.opened) return;
        let channel: Channel = this.channels[topic];
        if (!channel) {
            channel = this.multiplexer.channel(topic);
            channel.onopen = () => console.log(`channel ${topic} opened`);
            channel.onmessage = receive;
            channel.onclose = () => console.log(`channel ${topic} closed`);
            this.channels[topic] = channel;
        }
        return channel;
    }

    unsubscribe(topic) {
        if (!this.opened) return;
        let channel: Channel = this.channels[topic];
        if (channel) {
            channel.close();
            delete this.channels[topic];
        }
    }

    send(topic, message) {
        if (!this.opened) return;
        let channel: Channel = this.channels[topic];
        if (!channel)
            console.warn('You should subscribe this topic first');
        else
            channel.send(message)
    }
}

export default QueueClient
