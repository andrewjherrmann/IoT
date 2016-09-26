using System;
using System.IO;
using System.Net;

namespace Common
{
    public static class ExternalWebRequests
    {
        static ExternalWebRequests()
        {
            //Allow all client certs.  Treat a client cert like anonymous.
            ServicePointManager.ServerCertificateValidationCallback = delegate { return true; };
        }

        public static string ExternalWebRequest(byte[] content, HttpVerbs verb, string requestUriString, int timeout = 600000)
        {

            //Not for GETs
            if (string.Compare("GET", verb.ToString(), StringComparison.CurrentCultureIgnoreCase) == 0)
                throw new ArgumentException("Specified verb not valid for ExternalWebRequest");

            var request = HttpWebRequest.Create(requestUriString);
            request.Method = verb.ToString();
            request.ContentType = "application/json; charset=utf-8";
            request.Timeout = timeout;

            if (null != content)
            {
                request.ContentLength = content.Length;
                //request.ContentType = "application/x-www-form-urlencoded";
                request.GetRequestStream().Write(content, 0, content.Length);

                return GetResponse(request);
            }
            return null;
        }

        public static string ExternalHttpRequest(string requestUriString, HttpVerbs verb, int timeout = 600000, bool streamResult = true)
        {
            var request = WebRequest.Create(requestUriString);
            request.Method = verb.ToString();
            request.Timeout = timeout;
            if(verb == HttpVerbs.POST)
                request.ContentLength = 0;

            return GetResponse(request, streamResult);

        }

        static string GetResponse(WebRequest request, bool streamResult = true)
        {
            try
            {
                var webResponse = request.GetResponse() as HttpWebResponse;

                if (webResponse != null)
                {
                    if (!streamResult)
                        return webResponse.StatusCode.ToString();

                    if(webResponse.StatusCode == HttpStatusCode.OK && webResponse.ContentLength > 0)
                    {
                        using (var sr = new StreamReader(webResponse.GetResponseStream()))
                        {
                            var responseString = sr.ReadToEnd();
                            return responseString;
                        }
                    }
                }
                return String.Empty;
            }
            catch (WebException e)
            {
                throw e;
            }
        }
    }

    //public static class GenericsExtensions
    //{
    //    public static string AsString<T>(this T source);
    //}
    public enum HttpVerbs
    {
        GET,
        POST,
        PUT,
        DELETE
    }
}
