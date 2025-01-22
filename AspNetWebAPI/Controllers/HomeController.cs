using AspNetCoreAPI.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AspNetCoreAPI.Controllers
{
    [ApiController]
    [Authorize(Policy = "Admin")]
    [Route("[controller]")]
    public class HomeController : BaseController
    {
        public HomeController(ApplicationDbContext context) : base(context)
        {
        }

        [HttpGet]
        public IEnumerable<string> Get() => new List<string> { "Roman", "Martin", "Peter"};
    }
}
