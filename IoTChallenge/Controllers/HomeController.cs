using Common;
using IoTChallenge.Models;
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

        public JsonResult DefconLevel(DefconLevelChange defconLevelChange)
        {
            var model = new DefconModel();
            var result = model.ChangeDefconLevel(defconLevelChange);
            return new JsonResult() { Data = result };
        }
    }   
}
