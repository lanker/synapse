/*
 Copyright 2014 matrix.org
 
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 
 http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

angular.module('matrixWebClient')
.filter('duration', function() {
    return function(time) {
        if (!time) return;
        var t = parseInt(time / 1000);
        var s = t % 60;
        var m = parseInt(t / 60) % 60;
        var h = parseInt(t / (60 * 60)) % 24;
        var d = parseInt(t / (60 * 60 * 24));
        if (t < 60) {
            return s + "s";
        }
        if (t < 60 * 60) {
            return m + "m "; //  + s + "s";
        }
        if (t < 24 * 60 * 60) {
            return h + "h "; // + m + "m";
        }
        return d + "d "; // + h + "h";
    };
})
.filter('orderMembersList', function($sce) {
    return function(members) {
        var filtered = [];

        var displayNames = {};
        angular.forEach(members, function(value, key) {
            value["id"] = key;
            filtered.push( value );
            if (value["displayname"]) {
                if (!displayNames[value["displayname"]]) {
                    displayNames[value["displayname"]] = [];
                }
                displayNames[value["displayname"]].push(key);
            }
        });

        // FIXME: we shouldn't disambiguate displayNames on every orderMembersList
        // invocation but keep track of duplicates incrementally somewhere
        angular.forEach(displayNames, function(value, key) {
            if (value.length > 1) {
                // console.log(key + ": " + value);
                for (var i=0; i < value.length; i++) {
                    var v = value[i];
                    // FIXME: this permenantly rewrites the displayname for a given
                    // room member. which means we can't reset their name if it is
                    // no longer ambiguous!
                    members[v].displayname += " (" + v + ")";
                    // console.log(v + " " + members[v]);
                };
            }
        });

        filtered.sort(function (a, b) {
            return ((a["mtime_age"] || 10e10) > (b["mtime_age"] || 10e10) ? 1 : -1);
        });
        return filtered;
    };
})
.filter('unsafe', ['$sce', function($sce) {
    return function(text) {
        return $sce.trustAsHtml(text);
    };
}])

// Compute the room name according to information we have
.filter('roomName', ['$rootScope', 'matrixService', function($rootScope, matrixService) {
    return function(room_id) {
        var roomName;

        // If there is an alias, use it
        // TODO: only one alias is managed for now
        var alias = matrixService.getRoomIdToAliasMapping(room_id);
        if (alias) {
            roomName = alias;
        }

        if (undefined === roomName) {
            // Else, build the name from its users
            var room = $rootScope.events.rooms[room_id];
            if (room) {
                if (room.members) {
                    // Limit the room renaming to 1:1 room
                    if (2 === Object.keys(room.members).length) {
                        for (var i in room.members) {
                            var member = room.members[i];
                            if (member.user_id !== matrixService.config().user_id) {
                                roomName = member.content.displayname ?  member.content.displayname : member.user_id;
                            }
                        }
                    }
                }
            }
        }

        if (undefined === roomName) {
            // By default, use the room ID
            roomName = room_id;
        }

        return roomName;
    };
}]);
