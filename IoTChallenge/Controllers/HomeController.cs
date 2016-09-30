using Common;
using IoTChallenge.Hubs;
using IoTChallenge.Models;
using Microsoft.AspNet.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace IoTChallenge.Controllers
{
    //[Authorize]
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Defcon()
        {
            var model = new DefconModel();
            var results = model.GetRoomInfo();
            return View(results);
        }

        public void Refresh(string message)
        {
            IHubContext context = GlobalHost.ConnectionManager.GetHubContext<DefconHub>();
            var model = new DefconModel();
            var results = model.GetRoomInfo();
            context.Clients.All.loadResults(results);
        }

    }   
}
