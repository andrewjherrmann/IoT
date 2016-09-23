using Microsoft.AspNet.SignalR;
using System;

namespace IoTChallenge.Hubs
{
    public class DefconHub : Hub
    {
        //public void Hello()
        //{
        //    Clients.All.hello();
        //}
        public void Send(string name, string message)
        {
            // Call the addNewMessageToPage method to update clients.
            Clients.All.addNewMessageToPage(name, message);
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