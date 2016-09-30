using IoTChallenge.Models;
using Microsoft.AspNet.SignalR;
using System;

namespace IoTChallenge.Hubs
{
    public class DefconHub : Hub
    {
        public void Hello()
        {
            Clients.All.hello();
        }
        public void Send(string name, string message)
        {
            // Call the addNewMessageToPage method to update clients.
            Clients.All.addNewMessageToPage(name, message);
        }

        //public void DefconLevel(DefconLevelChange defconLevelChange)
        //{
        //    var model = new DefconModel();
        //    var result = model.ChangeDefconLevel(defconLevelChange);
        //    Clients.All.publishStatusToPage(result);
        //}

        public void DefconLevel(string room_id, string request_type)
        {
            var model = new DefconModel();
            var result = model.ChangeDefconLevel(new DefconLevelChange() { room_id = room_id, request_type = request_type });
            //result.room_id = room_id;
            //Clients.All.publishStatusToPage(result);
        }

        //public void Poll()
        //{
        //    var level = 5;
        //    while(1==1)
        //    {
        //        System.Threading.Thread.Sleep(5000);
        //        level--;
        //        if (level == 0)
        //            level = 5;
        //        Clients.All.publishStatusToPage("Defcon Level: " + level, DateTime.Now.ToString());
        //    }
        //}
    }
}