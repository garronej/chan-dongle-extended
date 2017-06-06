"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var ts_ami_1 = require("ts-ami");
var js_base64_1 = require("js-base64");
exports.amiUser = "dongle_ext_user";
var textKeyword = "base64text_part";
var maxMessageLength = 20000;
var usereventPrefix = "DongleAPI/";
function buildUserEvent(userevent, actionid) {
    actionid = actionid || ts_ami_1.Ami.generateUniqueActionId();
    return { userevent: userevent, actionid: actionid };
}
exports.buildUserEvent = buildUserEvent;
var Event;
(function (Event) {
    Event.userevent = usereventPrefix + "Event";
    function match(evt) {
        return evt.userevent === Event.userevent;
    }
    Event.match = match;
    function build(dongleevent) {
        return __assign({}, buildUserEvent(Event.userevent), { dongleevent: dongleevent });
    }
    Event.build = build;
    var NewMessage;
    (function (NewMessage) {
        NewMessage.dongleevent = "NewMessage";
        function match(evt) {
            return (Event.match(evt) &&
                evt.dongleevent === NewMessage.dongleevent);
        }
        NewMessage.match = match;
        function build(imei, number, date, text) {
            if (text.length > maxMessageLength)
                throw new Error("Message too long");
            var textParts = ts_ami_1.Ami.base64TextSplit(text);
            var out = __assign({}, Event.build(NewMessage.dongleevent), { imei: imei,
                number: number,
                date: date, "textsplitcount": "" + textParts.length });
            for (var i = 0; i < textParts.length; i++)
                out["" + textKeyword + i] = textParts[i];
            return out;
        }
        NewMessage.build = build;
        function reassembleText(evt) {
            var out = "";
            for (var i = 0; i < parseInt(evt.textsplitcount); i++)
                out += js_base64_1.Base64.decode(evt["" + textKeyword + i]);
            return out;
        }
        NewMessage.reassembleText = reassembleText;
    })(NewMessage = Event.NewMessage || (Event.NewMessage = {}));
    var NewActiveDongle;
    (function (NewActiveDongle) {
        NewActiveDongle.dongleevent = "NewActiveDongle";
        function match(evt) {
            return (Event.match(evt) &&
                evt.dongleevent === NewActiveDongle.dongleevent);
        }
        NewActiveDongle.match = match;
        function build(imei, iccid, imsi, number, serviceprovider) {
            return __assign({}, Event.build(NewActiveDongle.dongleevent), { imei: imei,
                iccid: iccid,
                imsi: imsi,
                number: number,
                serviceprovider: serviceprovider });
        }
        NewActiveDongle.build = build;
    })(NewActiveDongle = Event.NewActiveDongle || (Event.NewActiveDongle = {}));
    var ActiveDongleDisconnect;
    (function (ActiveDongleDisconnect) {
        ActiveDongleDisconnect.dongleevent = "ActiveDongleDisconnect";
        function match(evt) {
            return (Event.match(evt) &&
                evt.dongleevent === ActiveDongleDisconnect.dongleevent);
        }
        ActiveDongleDisconnect.match = match;
        function build(imei, iccid, imsi, number, serviceprovider) {
            return __assign({}, Event.build(ActiveDongleDisconnect.dongleevent), { imei: imei,
                iccid: iccid,
                imsi: imsi,
                number: number,
                serviceprovider: serviceprovider });
        }
        ActiveDongleDisconnect.build = build;
    })(ActiveDongleDisconnect = Event.ActiveDongleDisconnect || (Event.ActiveDongleDisconnect = {}));
    var RequestUnlockCode;
    (function (RequestUnlockCode) {
        RequestUnlockCode.dongleevent = "RequestUnlockCode";
        function match(evt) {
            return (Event.match(evt) &&
                evt.dongleevent === RequestUnlockCode.dongleevent);
        }
        RequestUnlockCode.match = match;
        function build(imei, iccid, pinstate, tryleft) {
            return __assign({}, Event.build(RequestUnlockCode.dongleevent), { imei: imei,
                iccid: iccid,
                pinstate: pinstate,
                tryleft: tryleft });
        }
        RequestUnlockCode.build = build;
    })(RequestUnlockCode = Event.RequestUnlockCode || (Event.RequestUnlockCode = {}));
    var LockedDongleDisconnect;
    (function (LockedDongleDisconnect) {
        LockedDongleDisconnect.dongleevent = "LockedDongleDisconnect";
        function match(evt) {
            return (Event.match(evt) &&
                evt.dongleevent === LockedDongleDisconnect.dongleevent);
        }
        LockedDongleDisconnect.match = match;
        function build(imei, iccid, pinstate, tryleft) {
            return __assign({}, Event.build(LockedDongleDisconnect.dongleevent), { imei: imei,
                iccid: iccid,
                pinstate: pinstate,
                tryleft: tryleft });
        }
        LockedDongleDisconnect.build = build;
    })(LockedDongleDisconnect = Event.LockedDongleDisconnect || (Event.LockedDongleDisconnect = {}));
    var MessageStatusReport;
    (function (MessageStatusReport) {
        MessageStatusReport.dongleevent = "MessageStatusReport";
        function match(evt) {
            return (Event.match(evt) &&
                evt.dongleevent === MessageStatusReport.dongleevent);
        }
        MessageStatusReport.match = match;
        function build(imei, messageid, dischargetime, isdelivered, status, recipient) {
            return __assign({}, Event.build(MessageStatusReport.dongleevent), { imei: imei,
                messageid: messageid,
                dischargetime: dischargetime,
                isdelivered: isdelivered,
                status: status,
                recipient: recipient });
        }
        MessageStatusReport.build = build;
    })(MessageStatusReport = Event.MessageStatusReport || (Event.MessageStatusReport = {}));
})(Event = exports.Event || (exports.Event = {}));
var Request;
(function (Request) {
    Request.userevent = usereventPrefix + "Request";
    function match(evt) {
        return (evt.userevent === Request.userevent &&
            "donglerequest" in evt);
    }
    Request.match = match;
    function build(donglerequest) {
        return __assign({}, buildUserEvent(Request.userevent), { donglerequest: donglerequest });
    }
    Request.build = build;
    var UpdateNumber;
    (function (UpdateNumber) {
        UpdateNumber.donglerequest = "UpdateNumber";
        function match(evt) {
            return (Request.match(evt) &&
                evt.donglerequest === UpdateNumber.donglerequest &&
                "imei" in evt &&
                "number" in evt);
        }
        UpdateNumber.match = match;
        function build(imei, number) {
            return __assign({}, Request.build(UpdateNumber.donglerequest), { imei: imei,
                number: number });
        }
        UpdateNumber.build = build;
    })(UpdateNumber = Request.UpdateNumber || (Request.UpdateNumber = {}));
    var GetSimPhonebook;
    (function (GetSimPhonebook) {
        GetSimPhonebook.donglerequest = "GetSimPhonebook";
        function match(evt) {
            return (Request.match(evt) &&
                evt.donglerequest === GetSimPhonebook.donglerequest &&
                "imei" in evt);
        }
        GetSimPhonebook.match = match;
        function build(imei) {
            return __assign({}, Request.build(GetSimPhonebook.donglerequest), { imei: imei });
        }
        GetSimPhonebook.build = build;
    })(GetSimPhonebook = Request.GetSimPhonebook || (Request.GetSimPhonebook = {}));
    var DeleteContact;
    (function (DeleteContact) {
        DeleteContact.donglerequest = "DeleteContact";
        function match(evt) {
            return (Request.match(evt) &&
                evt.donglerequest === DeleteContact.donglerequest &&
                "imei" in evt &&
                "index" in evt);
        }
        DeleteContact.match = match;
        function build(imei, index) {
            return __assign({}, Request.build(DeleteContact.donglerequest), { imei: imei,
                index: index });
        }
        DeleteContact.build = build;
    })(DeleteContact = Request.DeleteContact || (Request.DeleteContact = {}));
    var CreateContact;
    (function (CreateContact) {
        CreateContact.donglerequest = "CreateContact";
        function match(evt) {
            return (Request.match(evt) &&
                evt.donglerequest === CreateContact.donglerequest &&
                "imei" in evt &&
                "name" in evt &&
                "number" in evt);
        }
        CreateContact.match = match;
        function build(imei, name, number) {
            return __assign({}, Request.build(CreateContact.donglerequest), { imei: imei,
                name: name,
                number: number });
        }
        CreateContact.build = build;
    })(CreateContact = Request.CreateContact || (Request.CreateContact = {}));
    var GetMessages;
    (function (GetMessages) {
        GetMessages.donglerequest = "GetMessages";
        function match(evt) {
            return (Request.match(evt) &&
                evt.donglerequest === GetMessages.donglerequest &&
                "imei" in evt &&
                (evt.flush === "true" ||
                    evt.flush === "false"));
        }
        GetMessages.match = match;
        function build(imei, flush) {
            return __assign({}, Request.build(GetMessages.donglerequest), { imei: imei,
                flush: flush });
        }
        GetMessages.build = build;
    })(GetMessages = Request.GetMessages || (Request.GetMessages = {}));
    var SendMessage;
    (function (SendMessage) {
        SendMessage.donglerequest = "SendMessage";
        function match(evt) {
            return (Request.match(evt) &&
                evt.donglerequest === SendMessage.donglerequest &&
                "imei" in evt &&
                "number" in evt &&
                (("textsplitcount" in evt && textKeyword + "0" in evt) || "text" in evt));
        }
        SendMessage.match = match;
        function build(imei, number, text) {
            if (text.length > maxMessageLength)
                throw new Error("Message too long");
            var textParts = ts_ami_1.Ami.base64TextSplit(text);
            var out = __assign({}, Request.build(SendMessage.donglerequest), { imei: imei,
                number: number, "textsplitcount": "" + textParts.length });
            for (var i = 0; i < textParts.length; i++)
                out["" + textKeyword + i] = textParts[i];
            return out;
        }
        SendMessage.build = build;
        function reassembleText(evt) {
            if (evt.text) {
                try {
                    return JSON.parse(evt.text);
                }
                catch (error) {
                    return evt.text;
                }
            }
            var out = "";
            for (var i = 0; i < parseInt(evt.textsplitcount); i++)
                out += js_base64_1.Base64.decode(evt["" + textKeyword + i]);
            return out;
        }
        SendMessage.reassembleText = reassembleText;
    })(SendMessage = Request.SendMessage || (Request.SendMessage = {}));
    var GetLockedDongles;
    (function (GetLockedDongles) {
        GetLockedDongles.donglerequest = "GetLockedDongles";
        function match(evt) {
            return (Request.match(evt) &&
                evt.donglerequest === GetLockedDongles.donglerequest);
        }
        GetLockedDongles.match = match;
        function build() {
            return __assign({}, Request.build(GetLockedDongles.donglerequest));
        }
        GetLockedDongles.build = build;
    })(GetLockedDongles = Request.GetLockedDongles || (Request.GetLockedDongles = {}));
    var GetActiveDongles;
    (function (GetActiveDongles) {
        GetActiveDongles.donglerequest = "GetActiveDongles";
        function match(evt) {
            return (Request.match(evt) &&
                evt.donglerequest === GetActiveDongles.donglerequest);
        }
        GetActiveDongles.match = match;
        function build() {
            return __assign({}, Request.build(GetActiveDongles.donglerequest));
        }
        GetActiveDongles.build = build;
    })(GetActiveDongles = Request.GetActiveDongles || (Request.GetActiveDongles = {}));
    var UnlockDongle;
    (function (UnlockDongle) {
        UnlockDongle.donglerequest = "UnlockDongle";
        function match(evt) {
            return (Request.match(evt) &&
                evt.donglerequest === UnlockDongle.donglerequest &&
                "imei" in evt &&
                "pin" in evt !== ("puk" in evt && "newpin" in evt));
        }
        UnlockDongle.match = match;
        function build() {
            var inputs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                inputs[_i] = arguments[_i];
            }
            var base = __assign({}, Request.build(UnlockDongle.donglerequest), { "imei": inputs[0] });
            if (inputs.length === 2)
                return __assign({}, base, { "pin": inputs[1] });
            else
                return __assign({}, base, { "puk": inputs[1], "newpin": inputs[2] });
        }
        UnlockDongle.build = build;
    })(UnlockDongle = Request.UnlockDongle || (Request.UnlockDongle = {}));
})(Request = exports.Request || (exports.Request = {}));
var Response;
(function (Response) {
    Response.userevent = "DongleExt Response";
    function match(actionid) {
        return function (evt) {
            return (evt.actionid === actionid &&
                evt.userevent === Response.userevent);
        };
    }
    Response.match = match;
    function build(actionid, error) {
        var out = buildUserEvent(Response.userevent, actionid);
        if (typeof error === "string")
            out = __assign({}, out, { error: error });
        return out;
    }
    Response.build = build;
    var SendMessage;
    (function (SendMessage) {
        function match(actionid) {
            return function (evt) {
                return Response.match(actionid)(evt);
            };
        }
        SendMessage.match = match;
        function build(actionid, messageid) {
            return __assign({}, Response.build(actionid), { messageid: messageid });
        }
        SendMessage.build = build;
    })(SendMessage = Response.SendMessage || (Response.SendMessage = {}));
    var CreateContact;
    (function (CreateContact) {
        function match(actionid) {
            return function (evt) {
                return Response.match(actionid)(evt);
            };
        }
        CreateContact.match = match;
        function build(actionid, index, name, number) {
            return __assign({}, Response.build(actionid), { index: index,
                name: name,
                number: number });
        }
        CreateContact.build = build;
    })(CreateContact = Response.CreateContact || (Response.CreateContact = {}));
    var GetSimPhonebook_first;
    (function (GetSimPhonebook_first) {
        function match(actionid) {
            return function (evt) {
                return (Response.match(actionid)(evt) &&
                    ("contactcount" in evt || "error" in evt));
            };
        }
        GetSimPhonebook_first.match = match;
        function build(actionid, contactnamemaxlength, numbermaxlength, storageleft, contactcount) {
            return __assign({}, Response.build(actionid), { contactnamemaxlength: contactnamemaxlength,
                numbermaxlength: numbermaxlength,
                storageleft: storageleft,
                contactcount: contactcount });
        }
        GetSimPhonebook_first.build = build;
    })(GetSimPhonebook_first = Response.GetSimPhonebook_first || (Response.GetSimPhonebook_first = {}));
    var GetSimPhonebook_follow;
    (function (GetSimPhonebook_follow) {
        function match(actionid) {
            return function (evt) {
                return (Response.match(actionid)(evt) &&
                    !GetSimPhonebook_first.match(actionid)(evt));
            };
        }
        GetSimPhonebook_follow.match = match;
        function build(actionid, index, name, number) {
            return __assign({}, Response.build(actionid), { index: index,
                name: name,
                number: number });
        }
        GetSimPhonebook_follow.build = build;
    })(GetSimPhonebook_follow = Response.GetSimPhonebook_follow || (Response.GetSimPhonebook_follow = {}));
    var GetLockedDongles_first;
    (function (GetLockedDongles_first) {
        function match(actionid) {
            return function (evt) {
                return (Response.match(actionid)(evt) &&
                    "donglecount" in evt);
            };
        }
        GetLockedDongles_first.match = match;
        function build(actionid, donglecount) {
            return __assign({}, Response.build(actionid), { donglecount: donglecount });
        }
        GetLockedDongles_first.build = build;
    })(GetLockedDongles_first = Response.GetLockedDongles_first || (Response.GetLockedDongles_first = {}));
    var GetLockedDongles_follow;
    (function (GetLockedDongles_follow) {
        function match(actionid) {
            return function (evt) {
                return (Response.match(actionid)(evt) &&
                    !GetLockedDongles_first.match(actionid)(evt));
            };
        }
        GetLockedDongles_follow.match = match;
        function build(actionid, imei, iccid, pinstate, tryleft) {
            return __assign({}, Response.build(actionid), { imei: imei,
                iccid: iccid,
                pinstate: pinstate,
                tryleft: tryleft });
        }
        GetLockedDongles_follow.build = build;
    })(GetLockedDongles_follow = Response.GetLockedDongles_follow || (Response.GetLockedDongles_follow = {}));
    var GetMessages_first;
    (function (GetMessages_first) {
        function match(actionid) {
            return function (evt) {
                return (Response.match(actionid)(evt) &&
                    ("messagescount" in evt || "error" in evt));
            };
        }
        GetMessages_first.match = match;
        function build(actionid, messagescount) {
            return __assign({}, Response.build(actionid), { messagescount: messagescount });
        }
        GetMessages_first.build = build;
    })(GetMessages_first = Response.GetMessages_first || (Response.GetMessages_first = {}));
    var GetMessages_follow;
    (function (GetMessages_follow) {
        function match(actionid) {
            return function (evt) {
                return (Response.match(actionid)(evt) &&
                    !GetMessages_first.match(actionid)(evt));
            };
        }
        GetMessages_follow.match = match;
        function build(actionid, number, date, text) {
            if (text.length > maxMessageLength)
                throw new Error("Message too long");
            var textParts = ts_ami_1.Ami.base64TextSplit(text);
            var out = __assign({}, Response.build(Request.GetMessages.donglerequest, actionid), { number: number,
                date: date, "textsplitcount": "" + textParts.length });
            for (var i = 0; i < textParts.length; i++)
                out["" + textKeyword + i] = textParts[i];
            return out;
        }
        GetMessages_follow.build = build;
        function reassembleText(evt) {
            var out = "";
            for (var i = 0; i < parseInt(evt.textsplitcount); i++)
                out += js_base64_1.Base64.decode(evt["" + textKeyword + i]);
            return out;
        }
        GetMessages_follow.reassembleText = reassembleText;
    })(GetMessages_follow = Response.GetMessages_follow || (Response.GetMessages_follow = {}));
    var GetActiveDongles_first;
    (function (GetActiveDongles_first) {
        function match(actionid) {
            return function (evt) {
                return (Response.match(actionid)(evt) &&
                    "donglecount" in evt);
            };
        }
        GetActiveDongles_first.match = match;
        function build(actionid, donglecount) {
            return __assign({}, Response.build(actionid), { donglecount: donglecount });
        }
        GetActiveDongles_first.build = build;
    })(GetActiveDongles_first = Response.GetActiveDongles_first || (Response.GetActiveDongles_first = {}));
    var GetActiveDongles_follow;
    (function (GetActiveDongles_follow) {
        function match(actionid) {
            return function (evt) {
                return (Response.match(actionid)(evt) &&
                    !GetActiveDongles_first.match(actionid)(evt));
            };
        }
        GetActiveDongles_follow.match = match;
        function build(actionid, imei, iccid, imsi, number, serviceprovider) {
            return __assign({}, Response.build(actionid), { imei: imei,
                iccid: iccid,
                imsi: imsi,
                number: number,
                serviceprovider: serviceprovider });
        }
        GetActiveDongles_follow.build = build;
    })(GetActiveDongles_follow = Response.GetActiveDongles_follow || (Response.GetActiveDongles_follow = {}));
})(Response = exports.Response || (exports.Response = {}));
/*END RESPONSE*/
//# sourceMappingURL=AmiUserEvents.js.map