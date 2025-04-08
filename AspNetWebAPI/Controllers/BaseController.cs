using AspNetCoreAPI.Data;
using AspNetCoreAPI.DTO;
using AspNetCoreAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AspNetCoreAPI.Controllers
{
    [ApiController]
    [Controller]
    [Route("[controller]")]
    
    public class BaseController : ControllerBase
    {
        protected readonly ApplicationDbContext Context;

        public BaseController(ApplicationDbContext context) => Context = context;


        [HttpGet("/vratChessOpenings")]
        public IEnumerable<chessOpeningDTO >GetChessOpenings()
        {
            var dbOpenings = Context.Classes;
            return dbOpenings.Select(x =>
            new chessOpeningDTO
            {
                Description = x.Description,
                Name = x.Name,
                Id = x.Id,
            });
        }

        protected User? GetCurrentUser()
        {
            var userName = User.FindFirstValue(ClaimTypes.Name);

            return Context.Users.SingleOrDefault(user => user.UserName == userName);
        }
    }
}