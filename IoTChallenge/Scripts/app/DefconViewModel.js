$.ajaxSetup({ contentType: "application/json; charset=utf-8" });

function DefconItemModel(data){
    var self = this;
    self.room_id = ko.observable(data.room_id);
    self.name = ko.observable(data.name);
    self.current_level = ko.observable(data.current_level);
    self.configuration_last_updated = ko.observable(data.configuration_last_updated);
    self.level_last_updated = ko.observable(data.level_last_updated);
    self.level_last_updated_by = ko.observable(data.level_last_updated_by);
    self.level_auto_lower_time = ko.observable(data.level_auto_lower_time);

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
        var requestData = { room_id: self.room_id(), request_type: "raise" };
        $.post('DefconLevel', ko.toJSON(requestData), function (data) {
            self.current_level(data.current_level);
        });
    };

    self.lower = function () {
        var requestData = { room_id: self.room_id(), request_type: "lower" };
        $.post('DefconLevel', ko.toJSON(requestData), function (data) {
            self.current_level(data.current_level);
        });
    };

    self.instantDeath = function () {
        var requestData = { room_id: self.room_id(), request_type: "instantdeath" };
        if (confirm("Are you sure you want to set the level to instant death?  If so, it was really nice knowing you...")) {
            $.post('DefconLevel', ko.toJSON(requestData), function (data) {
                self.current_level(data.current_level);
            });

        }
    };
}

function DefconViewModel(data) {
    var self = this;
    self.offset = ko.observable();
    self.limit = ko.observable();
    self.count = ko.observable();
    self.items = ko.observableArray();

    self.Load = function (data) {
        self.offset(data.offset);
        self.limit(data.limit);
        self.count(data.count);
        data.items.forEach(function (c) {
            self.items.push(new DefconItemModel(c));
        });
    }

    self.Load(data);
    
}


