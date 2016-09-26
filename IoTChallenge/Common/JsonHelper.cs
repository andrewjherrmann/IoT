using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace Common
{
    public static class JsonHelper
    {
        private static JsonSerializerSettings m_settings;

        static JsonHelper()
        {
            m_settings = new JsonSerializerSettings { TypeNameHandling = TypeNameHandling.All };
        }

        public static string Serialize(object obj)
        {
            return JsonConvert.SerializeObject(obj, m_settings);
        }

        public static T Deserialize<T>(string val)
        {

            return JsonConvert.DeserializeObject<T>(val, m_settings);
        }
    }
}
