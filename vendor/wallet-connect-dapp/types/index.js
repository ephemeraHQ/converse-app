export var ConnectorEvents;
(function (ConnectorEvents) {
    ConnectorEvents["CONNECT"] = "connect";
    ConnectorEvents["CALL_REQUEST_SENT"] = "call_request_sent";
    ConnectorEvents["SESSION_UPDATE"] = "session_update";
    ConnectorEvents["DISCONNECT"] = "disconnect";
})(ConnectorEvents || (ConnectorEvents = {}));
