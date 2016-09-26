using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Common;

namespace IoTChallenge.Models
{
    public class DefconModel
    {
        public const string DefconUrl = "https://alee1se82m.execute-api.us-west-2.amazonaws.com/prod/room";
        public RoomResponse GetRoomInfo()
        {
            var result = ExternalWebRequests.ExternalHttpRequest(DefconUrl, Common.HttpVerbs.GET);
            return JsonHelper.Deserialize<RoomResponse>(result);
        }

        public Item ChangeDefconLevel(DefconLevelChange defconLevelChange)
        {
            var data = System.Text.Encoding.UTF8.GetBytes(JsonHelper.Serialize(defconLevelChange));
            var result = (ExternalWebRequests.ExternalWebRequest(data, HttpVerbs.POST, DefconUrl + "/" + defconLevelChange.request_type));
            return JsonHelper.Deserialize<Item>(result);
        }
    }

    public class Item
    {
        public string room_id { get; set; }
        public string name { get; set; }
        public int current_level { get; set; }
        public string configuration_last_updated { get; set; }
        public string level_last_updated { get; set; }
        public string level_last_updated_by { get; set; }
        public int level_auto_lower_time { get; set; }
    }

    public class RoomResponse
    {
        public int offset { get; set; }
        public int limit { get; set; }
        public int count { get; set; }
        public List<Item> items { get; set; }
    }

    public class DefconLevelChange
    {
        public string room_id { get; set; }
        public string request_type { get; set; }
    }
}