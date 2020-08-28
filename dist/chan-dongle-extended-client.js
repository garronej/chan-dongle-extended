"use strict";
// For dist replace ../../chan-dongle-extended-client by chan-dongle-extended-client
Object.defineProperty(exports, "__esModule", { value: true });
exports.DongleController = exports.misc = exports.apiDeclaration = exports.types = void 0;
var apiDeclaration = require("chan-dongle-extended-client/dist/lib/apiDeclaration");
exports.apiDeclaration = apiDeclaration;
var misc = require("chan-dongle-extended-client/dist/lib/misc");
exports.misc = misc;
var chan_dongle_extended_client_1 = require("chan-dongle-extended-client");
Object.defineProperty(exports, "types", { enumerable: true, get: function () { return chan_dongle_extended_client_1.types; } });
Object.defineProperty(exports, "DongleController", { enumerable: true, get: function () { return chan_dongle_extended_client_1.DongleController; } });
