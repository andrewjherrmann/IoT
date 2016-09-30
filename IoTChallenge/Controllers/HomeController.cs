using Common;
using IoTChallenge.Hubs;
using IoTChallenge.Models;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
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

        [System.Web.Mvc.HttpPost]
        public void Refresh()
        {
            IHubContext context = GlobalHost.ConnectionManager.GetHubContext<DefconHub>();
            var model = new DefconModel();
            var results = model.GetRoomInfo();
            context.Clients.All.loadResults(results);

            var body = new System.IO.StreamReader(HttpContext.Request.InputStream).ReadToEnd();
            var message = JsonConvert.DeserializeObject<SnsMessage>(body);

            if (null != message && !string.IsNullOrWhiteSpace(message.SubscribeURL))
            {
                context.Clients.All.addNewMessageToPage("API", "Confirming SNS Subscription");
                ExternalWebRequests.ExternalHttpRequest(message.SubscribeURL, Common.HttpVerbs.GET);
            }
        }

        public class SnsMessage
        {
            public string Type { get; set; }
            public string MessageId { get; set; }
            public string Token { get; set; }
            public string TopicArn { get; set; }
            public string Message { get; set; }
            public string SubscribeURL { get; set; }
            public string Timestamp { get; set; }
            public string SignatureVersion { get; set; }
            public string Signature { get; set; }
            public string SigningCertURL { get; set; }
        }

    }   
}
