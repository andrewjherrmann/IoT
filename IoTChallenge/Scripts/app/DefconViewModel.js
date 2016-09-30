$.ajaxSetup({ contentType: "application/json; charset=utf-8" });

function DefconItemModel(data, defcon){
    var self = this;
    self.defcon = defcon;
    self.room_id = ko.observable(data.room_id);
    self.name = ko.observable(data.name);
    self.current_level = ko.observable(data.current_level);
    self.configuration_last_updated = ko.observable(data.configuration_last_updated);
    self.level_last_updated = ko.observable(data.level_last_updated);
    self.level_last_updated_by = ko.observable(data.level_last_updated_by);
    self.level_auto_lower_time = ko.observable(data.level_auto_lower_time);
    self.nameTitle = ko.observable("Last Updated: " + moment(self.level_last_updated()).format("LLLL"));

    self.progress_style = ko.computed(function () {
        switch (self.current_level()) {
            case 1:
                return "progress-bar progress-bar-danger width100";
            case 2:
                return "progress-bar progress-bar-warning width80";
            case 3:
                return "progress-bar width60";
            case 4:
                return "progress-bar progress-bar-info width40";
            case 5:
                return "progress-bar progress-bar-success width20";
            default:
                return "progress-bar progress-bar-success";
        }
    });

    self.raise = function () {
        self.defcon.server.defconLevel(self.room_id(), "raise");
    };

    self.lower = function () {
        self.defcon.server.defconLevel(self.room_id(), "lower");
    };

    self.instantDeath = function () {
        if (confirm("Are you sure you want to set the level to instant death?  If so, it was really nice knowing you...")) {
            self.defcon.server.defconLevel(self.room_id(), "instantdeath");
        }
    };
}

function DefconViewModel(data) {
    var self = this;
    self.defcon = $.connection.defconHub;
    self.offset = ko.observable();
    self.limit = ko.observable();
    self.count = ko.observable();
    self.items = ko.observableArray();
    self.messages = ko.observableArray();
    self.displayName = ko.observable();
    self.message = ko.observable("");


    self.Load = function (data) {
        self.offset(data.offset);
        self.limit(data.limit);
        self.count(data.count);
        data.items.forEach(function (c) {
            self.items.push(new DefconItemModel(c, self.defcon));
        });
    }

    // Create a function that the hub can call back to display messages.
    self.defcon.client.addNewMessageToPage = function (name, message) {
        self.messages.push({ "name": htmlEncode(name), "message": htmlEncode(message) });
    };

    self.defcon.client.publishStatusToPage = function (data) {
        var match = ko.utils.arrayFirst(self.items(), function (item) {
            if (data.room_id === item.room_id()) {
                item.current_level(data.current_level);
                item.level_last_updated(data.level_last_updated);
            }
        });

    };

    self.defcon.client.loadResults = function (data) {
        data.items.forEach(function (item) {
            self.defcon.client.publishStatusToPage(item);
        })
    };

    self.sendMessage = function () {
        // Call the Send method on the hub.
        self.defcon.server.send(self.displayName(), self.message());
        self.message("");
        // Clear text box and reset focus for next comment.
        $('#message').focus();
    };

    // Start the connection.
    $.connection.hub.start();

    // This optional function html-encodes messages for display in the page.
    function htmlEncode(value) {
        var encodedValue = $('<div />').text(value).html();
        return encodedValue;
    }

    // Get the user name and store it to prepend to messages.
    self.displayName(prompt('Please enter your name if you would like to be identified in the chat feature:', ''));
    // Set initial focus to message input box.
    $('#message').focus();

    self.Load(data);
}


