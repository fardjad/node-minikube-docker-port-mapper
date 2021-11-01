import TCPProxy from "tcp-proxy.js";
import UDPProxy from "udp-proxy";

const proxies = new Map();

const createTCPProxy = async ({sourceHost, sourcePort, destinationHost, destinationPort}) => {
    const proxy = new TCPProxy({
        host: sourceHost,
        port: sourcePort,
    });

    await proxy.createProxy({
        forwardHost: destinationHost,
        forwardPort: destinationPort,
    });

    return {
        rawProxyObject: proxy,
        stop() {
            return proxy.end();
        },
    };
}

const createUDPProxy = async ({sourceHost, sourcePort, destinationHost, destinationPort}) => {
    const proxy = await new UDPProxy.createServer({
        localaddress: sourceHost,
        localport: sourcePort,
        address: destinationHost,
        port: destinationPort,
    });

    return {
        rawProxyObject: proxy,
        stop() {
            return new Promise((resolve, reject) => {
                proxy.close((err) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve();
                });
            });
        },
    };
}

const createProxy = async (options) => {
    const fns = {
        tcp: createTCPProxy,
        udp: createUDPProxy
    }

    return fns[options.protocol](options);
};

export const proxyOptionsToKey = ({protocol, sourceHost, sourcePort, destinationHost, destinationPort}) => {
    return `${protocol}:${sourceHost}:${sourcePort}:${destinationHost}:${destinationPort}`;
};

export const configureProxies = async (optionsList) => {
    const newProxyKeys = new Set(optionsList.map(proxyOptionsToKey));

    const proxyKeysToStop = new Set(proxies.keys());
    for (const key of newProxyKeys) {
        proxyKeysToStop.delete(key);
    }

    for (const key of proxyKeysToStop) {
        await proxies.get(key).stop();
        proxies.delete(key);
    }
    for (const proxyOptions of optionsList) {
        const key = proxyOptionsToKey(proxyOptions);
        if (proxies.has(key)) {
            continue;
        }

        const proxy = await createProxy({
            ...proxyOptions,
            sourceHost: proxyOptions.sourceHost ?? 'localhost'
        });

        proxies.set(key, proxy);
    }
}
