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
var divide_1 = require("../tools/divide");
var counter = Date.now();
var UserEvent;
(function (UserEvent) {
    function buildAction(userevent, actionid) {
        actionid = actionid || (counter++).toString();
        return {
            "action": "UserEvent",
            userevent: userevent,
            actionid: actionid
        };
    }
    UserEvent.buildAction = buildAction;
    var Event;
    (function (Event) {
        Event.keyword = "DongleExt Event";
        function matchEvt(evt) {
            return (evt.userevent === Event.keyword);
        }
        Event.matchEvt = matchEvt;
        function buildAction(dongleevent) {
            return __assign({}, UserEvent.buildAction(Event.keyword), { dongleevent: dongleevent });
        }
        Event.buildAction = buildAction;
        var RequestUnlockCode;
        (function (RequestUnlockCode) {
            RequestUnlockCode.keyword = "RequestUnlockCode";
            function matchEvt(evt) {
                return (Event.matchEvt(evt) &&
                    evt.dongleevent === RequestUnlockCode.keyword);
            }
            RequestUnlockCode.matchEvt = matchEvt;
            function buildAction(imei, iccid, pinstate, tryleft) {
                return __assign({}, Event.buildAction(RequestUnlockCode.keyword), { imei: imei,
                    iccid: iccid,
                    pinstate: pinstate,
                    tryleft: tryleft });
            }
            RequestUnlockCode.buildAction = buildAction;
        })(RequestUnlockCode = Event.RequestUnlockCode || (Event.RequestUnlockCode = {}));
        var NewMessage;
        (function (NewMessage) {
            NewMessage.keyword = "NewMessage";
            function matchEvt(evt) {
                return (Event.matchEvt(evt) &&
                    evt.dongleevent === NewMessage.keyword);
            }
            NewMessage.matchEvt = matchEvt;
            function buildAction(imei, number, date, text) {
                var textParts = divide_1.divide(500, text);
                var out = __assign({}, Event.buildAction(NewMessage.keyword), { imei: imei,
                    number: number,
                    date: date, "textsplitcount": textParts.length.toString() });
                for (var i = 0; i < textParts.length; i++)
                    out["text" + i] = JSON.stringify(textParts[i]);
                return out;
            }
            NewMessage.buildAction = buildAction;
            function reassembleText(evt) {
                var out = "";
                for (var i = 0; i < parseInt(evt.textsplitcount); i++)
                    out += JSON.parse(evt["text" + i]);
                return out;
            }
            NewMessage.reassembleText = reassembleText;
        })(NewMessage = Event.NewMessage || (Event.NewMessage = {}));
        var NewActiveDongle;
        (function (NewActiveDongle) {
            NewActiveDongle.keyword = "NewActiveDongle";
            function matchEvt(evt) {
                return (Event.matchEvt(evt) &&
                    evt.dongleevent === NewActiveDongle.keyword);
            }
            NewActiveDongle.matchEvt = matchEvt;
            function buildAction(imei, iccid, imsi, number) {
                return __assign({}, Event.buildAction(NewActiveDongle.keyword), { imei: imei,
                    iccid: iccid,
                    imsi: imsi,
                    number: number });
            }
            NewActiveDongle.buildAction = buildAction;
        })(NewActiveDongle = Event.NewActiveDongle || (Event.NewActiveDongle = {}));
        var DongleDisconnect;
        (function (DongleDisconnect) {
            DongleDisconnect.keyword = "DongleDisconnect";
            function matchEvt(evt) {
                return (Event.matchEvt(evt) &&
                    evt.dongleevent === DongleDisconnect.keyword);
            }
            DongleDisconnect.matchEvt = matchEvt;
            function buildAction(imei, iccid, imsi, number) {
                return __assign({}, Event.buildAction(DongleDisconnect.keyword), { imei: imei,
                    iccid: iccid,
                    imsi: imsi,
                    number: number });
            }
            DongleDisconnect.buildAction = buildAction;
        })(DongleDisconnect = Event.DongleDisconnect || (Event.DongleDisconnect = {}));
        var MessageStatusReport;
        (function (MessageStatusReport) {
            MessageStatusReport.keyword = "MessageStatusReport";
            function matchEvt(evt) {
                return (Event.matchEvt(evt) &&
                    evt.dongleevent === MessageStatusReport.keyword);
            }
            MessageStatusReport.matchEvt = matchEvt;
            function buildAction(imei, messageid, dischargetime, isdelivered, status) {
                return __assign({}, Event.buildAction(MessageStatusReport.keyword), { imei: imei,
                    messageid: messageid,
                    dischargetime: dischargetime,
                    isdelivered: isdelivered,
                    status: status });
            }
            MessageStatusReport.buildAction = buildAction;
        })(MessageStatusReport = Event.MessageStatusReport || (Event.MessageStatusReport = {}));
    })(Event = UserEvent.Event || (UserEvent.Event = {}));
    var Request;
    (function (Request) {
        Request.keyword = "DongleExt Request";
        function matchEvt(evt) {
            return (evt.userevent === Request.keyword &&
                evt.hasOwnProperty("command"));
        }
        Request.matchEvt = matchEvt;
        function buildAction(command) {
            return __assign({}, UserEvent.buildAction(Request.keyword), { command: command });
        }
        Request.buildAction = buildAction;
        var GetSimPhonebook;
        (function (GetSimPhonebook) {
            GetSimPhonebook.keyword = "GetSimPhonebook";
            function matchEvt(evt) {
                return (Request.matchEvt(evt) &&
                    evt.command === GetSimPhonebook.keyword &&
                    evt.hasOwnProperty("imei"));
            }
            GetSimPhonebook.matchEvt = matchEvt;
            function buildAction(imei) {
                return __assign({}, Request.buildAction(GetSimPhonebook.keyword), { imei: imei });
            }
            GetSimPhonebook.buildAction = buildAction;
        })(GetSimPhonebook = Request.GetSimPhonebook || (Request.GetSimPhonebook = {}));
        var DeleteContact;
        (function (DeleteContact) {
            DeleteContact.keyword = "DeleteContact";
            function matchEvt(evt) {
                return (Request.matchEvt(evt) &&
                    evt.command === DeleteContact.keyword &&
                    evt.hasOwnProperty("imei") &&
                    evt.hasOwnProperty("index"));
            }
            DeleteContact.matchEvt = matchEvt;
            function buildAction(imei, index) {
                return __assign({}, Request.buildAction(DeleteContact.keyword), { imei: imei,
                    index: index });
            }
            DeleteContact.buildAction = buildAction;
        })(DeleteContact = Request.DeleteContact || (Request.DeleteContact = {}));
        var CreateContact;
        (function (CreateContact) {
            CreateContact.keyword = "CreateContact";
            function matchEvt(evt) {
                return (Request.matchEvt(evt) &&
                    evt.command === CreateContact.keyword &&
                    evt.hasOwnProperty("imei") &&
                    evt.hasOwnProperty("name") &&
                    evt.hasOwnProperty("number"));
            }
            CreateContact.matchEvt = matchEvt;
            function buildAction(imei, name, number) {
                return __assign({}, Request.buildAction(CreateContact.keyword), { imei: imei,
                    name: name,
                    number: number });
            }
            CreateContact.buildAction = buildAction;
        })(CreateContact = Request.CreateContact || (Request.CreateContact = {}));
        var GetMessages;
        (function (GetMessages) {
            GetMessages.keyword = "GetMessages";
            function matchEvt(evt) {
                return (Request.matchEvt(evt) &&
                    evt.command === GetMessages.keyword &&
                    evt.hasOwnProperty("imei") &&
                    (evt.flush === "true" ||
                        evt.flush === "false"));
            }
            GetMessages.matchEvt = matchEvt;
            function buildAction(imei, flush) {
                return __assign({}, Request.buildAction(GetMessages.keyword), { imei: imei,
                    flush: flush });
            }
            GetMessages.buildAction = buildAction;
        })(GetMessages = Request.GetMessages || (Request.GetMessages = {}));
        var SendMessage;
        (function (SendMessage) {
            SendMessage.keyword = "SendMessage";
            function matchEvt(evt) {
                return (Request.matchEvt(evt) &&
                    evt.command === SendMessage.keyword &&
                    evt.hasOwnProperty("imei") &&
                    evt.hasOwnProperty("number") &&
                    ((evt.hasOwnProperty("textsplitcount") &&
                        evt.hasOwnProperty("text0")) || evt.hasOwnProperty("text")));
            }
            SendMessage.matchEvt = matchEvt;
            function buildAction(imei, number, text) {
                var textParts = divide_1.divide(500, text);
                var out = __assign({}, Request.buildAction(SendMessage.keyword), { imei: imei,
                    number: number, "textsplitcount": textParts.length.toString() });
                for (var i = 0; i < textParts.length; i++)
                    out["text" + i] = JSON.stringify(textParts[i]);
                return out;
            }
            SendMessage.buildAction = buildAction;
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
                    out += JSON.parse(evt["text" + i]);
                return out;
            }
            SendMessage.reassembleText = reassembleText;
        })(SendMessage = Request.SendMessage || (Request.SendMessage = {}));
        var GetLockedDongles;
        (function (GetLockedDongles) {
            GetLockedDongles.keyword = "GetLockedDongles";
            function matchEvt(evt) {
                return (Request.matchEvt(evt) &&
                    evt.command === GetLockedDongles.keyword);
            }
            GetLockedDongles.matchEvt = matchEvt;
            function buildAction() {
                return __assign({}, Request.buildAction(GetLockedDongles.keyword));
            }
            GetLockedDongles.buildAction = buildAction;
        })(GetLockedDongles = Request.GetLockedDongles || (Request.GetLockedDongles = {}));
        var GetActiveDongles;
        (function (GetActiveDongles) {
            GetActiveDongles.keyword = "GetActiveDongles";
            function matchEvt(evt) {
                return (Request.matchEvt(evt) &&
                    evt.command === GetActiveDongles.keyword);
            }
            GetActiveDongles.matchEvt = matchEvt;
            function buildAction() {
                return __assign({}, Request.buildAction(GetActiveDongles.keyword));
            }
            GetActiveDongles.buildAction = buildAction;
        })(GetActiveDongles = Request.GetActiveDongles || (Request.GetActiveDongles = {}));
        var UnlockDongle;
        (function (UnlockDongle) {
            UnlockDongle.keyword = "UnlockDongle";
            function matchEvt(evt) {
                return (Request.matchEvt(evt) &&
                    evt.command === UnlockDongle.keyword &&
                    evt.hasOwnProperty("imei") &&
                    (evt.hasOwnProperty("pin") !==
                        (evt.hasOwnProperty("puk") && evt.hasOwnProperty("newpin"))));
            }
            UnlockDongle.matchEvt = matchEvt;
            function buildAction() {
                var inputs = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    inputs[_i] = arguments[_i];
                }
                var base = __assign({}, Request.buildAction(UnlockDongle.keyword), { "imei": inputs[0] });
                if (inputs.length === 2)
                    return __assign({}, base, { "pin": inputs[1] });
                else
                    return __assign({}, base, { "puk": inputs[1], "newpin": inputs[2] });
            }
            UnlockDongle.buildAction = buildAction;
        })(UnlockDongle = Request.UnlockDongle || (Request.UnlockDongle = {}));
    })(Request = UserEvent.Request || (UserEvent.Request = {}));
    var Response;
    (function (Response) {
        Response.keyword = "DongleExt Response";
        function matchEvt(responseto, actionid) {
            return function (evt) {
                return (evt.actionid === actionid &&
                    evt.userevent === Response.keyword &&
                    evt.responseto === responseto);
            };
        }
        Response.matchEvt = matchEvt;
        function buildAction(responseto, actionid, error) {
            var out = __assign({}, UserEvent.buildAction(Response.keyword, actionid), { responseto: responseto });
            if (typeof error === "string")
                out.error = error;
            return out;
        }
        Response.buildAction = buildAction;
        var SendMessage;
        (function (SendMessage) {
            function matchEvt(actionid) {
                return function (evt) {
                    return Response.matchEvt(Request.SendMessage.keyword, actionid)(evt);
                };
            }
            SendMessage.matchEvt = matchEvt;
            function buildAction(actionid, messageid) {
                return __assign({}, Response.buildAction(Request.SendMessage.keyword, actionid), { messageid: messageid });
            }
            SendMessage.buildAction = buildAction;
        })(SendMessage = Response.SendMessage || (Response.SendMessage = {}));
        var CreateContact;
        (function (CreateContact) {
            function matchEvt(actionid) {
                return function (evt) {
                    return Response.matchEvt(Request.CreateContact.keyword, actionid)(evt);
                };
            }
            CreateContact.matchEvt = matchEvt;
            function buildAction(actionid, index, name, number) {
                return __assign({}, Response.buildAction(Request.CreateContact.keyword, actionid), { index: index,
                    name: name,
                    number: number });
            }
            CreateContact.buildAction = buildAction;
        })(CreateContact = Response.CreateContact || (Response.CreateContact = {}));
        var GetSimPhonebook;
        (function (GetSimPhonebook) {
            function matchEvt(actionid) {
                return function (evt) {
                    return Response.matchEvt(Request.GetSimPhonebook.keyword, actionid)(evt);
                };
            }
            GetSimPhonebook.matchEvt = matchEvt;
            var Infos;
            (function (Infos) {
                function matchEvt(actionid) {
                    return function (evt) {
                        return (Response.GetSimPhonebook.matchEvt(actionid)(evt) &&
                            (evt.hasOwnProperty("contactcount") ||
                                evt.hasOwnProperty("error")));
                    };
                }
                Infos.matchEvt = matchEvt;
                function buildAction(actionid, contactnamemaxlength, numbermaxlength, storageleft, contactcount) {
                    return __assign({}, Response.buildAction(Request.GetSimPhonebook.keyword, actionid), { contactnamemaxlength: contactnamemaxlength,
                        numbermaxlength: numbermaxlength,
                        storageleft: storageleft,
                        contactcount: contactcount });
                }
                Infos.buildAction = buildAction;
            })(Infos = GetSimPhonebook.Infos || (GetSimPhonebook.Infos = {}));
            var Entry;
            (function (Entry) {
                function matchEvt(actionid) {
                    return function (evt) {
                        return (Response.GetSimPhonebook.matchEvt(actionid)(evt) &&
                            evt.hasOwnProperty("index"));
                    };
                }
                Entry.matchEvt = matchEvt;
                function buildAction(actionid, index, name, number) {
                    return __assign({}, Response.buildAction(Request.GetSimPhonebook.keyword, actionid), { index: index,
                        name: name,
                        number: number });
                }
                Entry.buildAction = buildAction;
            })(Entry = GetSimPhonebook.Entry || (GetSimPhonebook.Entry = {}));
        })(GetSimPhonebook = Response.GetSimPhonebook || (Response.GetSimPhonebook = {}));
        var GetLockedDongles;
        (function (GetLockedDongles) {
            function matchEvt(actionid) {
                return function (evt) {
                    return Response.matchEvt(Request.GetLockedDongles.keyword, actionid)(evt);
                };
            }
            GetLockedDongles.matchEvt = matchEvt;
            var Infos;
            (function (Infos) {
                function matchEvt(actionid) {
                    return function (evt) {
                        return (GetLockedDongles.matchEvt(actionid)(evt) &&
                            evt.hasOwnProperty("donglecount"));
                    };
                }
                Infos.matchEvt = matchEvt;
                function buildAction(actionid, donglecount) {
                    return __assign({}, Response.buildAction(Request.GetLockedDongles.keyword, actionid), { donglecount: donglecount });
                }
                Infos.buildAction = buildAction;
            })(Infos = GetLockedDongles.Infos || (GetLockedDongles.Infos = {}));
            var Entry;
            (function (Entry) {
                function matchEvt(actionid) {
                    return function (evt) {
                        return (GetLockedDongles.matchEvt(actionid)(evt) &&
                            !GetLockedDongles.Infos.matchEvt(actionid)(evt));
                    };
                }
                Entry.matchEvt = matchEvt;
                function buildAction(actionid, imei, iccid, pinstate, tryleft) {
                    return __assign({}, Response.buildAction(Request.GetLockedDongles.keyword, actionid), { imei: imei,
                        iccid: iccid,
                        pinstate: pinstate,
                        tryleft: tryleft });
                }
                Entry.buildAction = buildAction;
            })(Entry = GetLockedDongles.Entry || (GetLockedDongles.Entry = {}));
        })(GetLockedDongles = Response.GetLockedDongles || (Response.GetLockedDongles = {}));
        var GetMessages;
        (function (GetMessages) {
            function matchEvt(actionid) {
                return function (evt) {
                    return Response.matchEvt(Request.GetMessages.keyword, actionid)(evt);
                };
            }
            GetMessages.matchEvt = matchEvt;
            var Infos;
            (function (Infos) {
                function matchEvt(actionid) {
                    return function (evt) {
                        return (Response.GetMessages.matchEvt(actionid)(evt) &&
                            (evt.hasOwnProperty("messagescount") ||
                                evt.hasOwnProperty("error")));
                    };
                }
                Infos.matchEvt = matchEvt;
                function buildAction(actionid, messagescount) {
                    return __assign({}, Response.buildAction(Request.GetMessages.keyword, actionid), { messagescount: messagescount });
                }
                Infos.buildAction = buildAction;
            })(Infos = GetMessages.Infos || (GetMessages.Infos = {}));
            var Entry;
            (function (Entry) {
                function matchEvt(actionid) {
                    return function (evt) {
                        return (Response.GetMessages.matchEvt(actionid)(evt) &&
                            !Response.GetMessages.Infos.matchEvt(actionid)(evt));
                    };
                }
                Entry.matchEvt = matchEvt;
                function buildAction(actionid, number, date, text) {
                    var textParts = divide_1.divide(500, text);
                    var out = __assign({}, Response.buildAction(Request.GetMessages.keyword, actionid), { number: number,
                        date: date, "textsplitcount": textParts.length.toString() });
                    for (var i = 0; i < textParts.length; i++)
                        out["text" + i] = JSON.stringify(textParts[i]);
                    return out;
                }
                Entry.buildAction = buildAction;
                function reassembleText(evt) {
                    var out = "";
                    for (var i = 0; i < parseInt(evt.textsplitcount); i++)
                        out += JSON.parse(evt["text" + i]);
                    return out;
                }
                Entry.reassembleText = reassembleText;
            })(Entry = GetMessages.Entry || (GetMessages.Entry = {}));
        })(GetMessages = Response.GetMessages || (Response.GetMessages = {}));
        var GetActiveDongles;
        (function (GetActiveDongles) {
            function matchEvt(actionid) {
                return function (evt) {
                    return Response.matchEvt(Request.GetActiveDongles.keyword, actionid)(evt);
                };
            }
            GetActiveDongles.matchEvt = matchEvt;
            var Infos;
            (function (Infos) {
                function matchEvt(actionid) {
                    return function (evt) {
                        return (GetActiveDongles.matchEvt(actionid)(evt) &&
                            evt.hasOwnProperty("donglecount"));
                    };
                }
                Infos.matchEvt = matchEvt;
                function buildAction(actionid, donglecount) {
                    return __assign({}, Response.buildAction(Request.GetActiveDongles.keyword, actionid), { donglecount: donglecount });
                }
                Infos.buildAction = buildAction;
            })(Infos = GetActiveDongles.Infos || (GetActiveDongles.Infos = {}));
            var Entry;
            (function (Entry) {
                function matchEvt(actionid) {
                    return function (evt) {
                        return (GetActiveDongles.matchEvt(actionid)(evt) &&
                            !GetActiveDongles.Infos.matchEvt(actionid)(evt));
                    };
                }
                Entry.matchEvt = matchEvt;
                function buildAction(actionid, imei, iccid, imsi, number) {
                    return __assign({}, Response.buildAction(Request.GetActiveDongles.keyword, actionid), { imei: imei,
                        iccid: iccid,
                        imsi: imsi,
                        number: number });
                }
                Entry.buildAction = buildAction;
            })(Entry = GetActiveDongles.Entry || (GetActiveDongles.Entry = {}));
        })(GetActiveDongles = Response.GetActiveDongles || (Response.GetActiveDongles = {}));
    })(Response = UserEvent.Response || (UserEvent.Response = {}));
    /*END RESPONSE*/
})(UserEvent = exports.UserEvent || (exports.UserEvent = {}));
//# sourceMappingURL=AmiUserEvent.js.map