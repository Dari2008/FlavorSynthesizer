import "./NotSupportedNotice.scss";

export default function DeviceNotSupported() {
    return <div className="device-not-supported">
        <h2>Device Not Supported</h2>
        <span>Your device is not supported. It has a too small screen!</span>
    </div>
}