using AspNetCoreAPI.Authentication.dto;
using AspNetCoreAPI.Models;
using AspNetCoreAPI.Registration.dto;
using Azure.Core;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using System.Text.Json.Serialization;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace AspNetCoreAPI.Registration
{
    [ApiController]
    [Route("[controller]")]
    public class UserController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly JwtHandler _jwtHandler;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ReCaptchaSettings _reCaptchaSettings;

        public UserController(UserManager<User> userManager, JwtHandler jwtHandler, IHttpClientFactory httpClientFactory, IOptions<ReCaptchaSettings> reCaptchaOptions)
        {
            _userManager = userManager;
            _jwtHandler = jwtHandler;
            _httpClientFactory = httpClientFactory;
            _reCaptchaSettings = reCaptchaOptions.Value;
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterUser([FromBody] UserRegistrationDto userRegistrationDto)
        {
            var captchaValidationResponse = await ValidateCaptcha(userRegistrationDto.CaptchaToken);
            if (captchaValidationResponse == null || !captchaValidationResponse.Success)
            {
                return BadRequest("Captcha validation failed.");
            }

            if (userRegistrationDto == null || !ModelState.IsValid)
                return BadRequest();

            var user = new User { UserName = userRegistrationDto.Email,  Email = userRegistrationDto.Email };
            var result = await _userManager.CreateAsync(user, userRegistrationDto.Password);
            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description);

                return BadRequest(new UserRegistrationResponseDto { Errors = errors });
            }
            
            return StatusCode(201);
        }

        private async Task<CaptchaResponse> ValidateCaptcha(string captchaToken)
        {
            var client = _httpClientFactory.CreateClient();
            var response = await client.PostAsync($"https://www.google.com/recaptcha/api/siteverify?secret={_reCaptchaSettings.SecretKey}&response={captchaToken}", null);

            var jsonResponse = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<CaptchaResponse>(jsonResponse);
            
        }

        [HttpPost("add-claim")]
        public async Task<IActionResult> AddClaim([FromBody] ClaimDto claimDto)
        {
            var user = await _userManager.FindByNameAsync(claimDto.userEmail);
            var result = await _userManager.AddClaimAsync(user, new System.Security.Claims.Claim(claimDto.type, claimDto.value));

            return Ok(result.Succeeded);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto userLoginDto)
        {
            var user = await _userManager.FindByNameAsync(userLoginDto.Email);

            if (user == null || !await _userManager.CheckPasswordAsync(user, userLoginDto.Password))
                return Unauthorized(new UserLoginResponseDto { ErrorMessage = "Invalid Authentication" });

            var signingCredentials = _jwtHandler.GetSigningCredentials();
            var claims = _jwtHandler.GetClaims(user);
            claims.AddRange(await _userManager.GetClaimsAsync(user));
            var tokenOptions = _jwtHandler.GenerateTokenOptions(signingCredentials, claims);
            var token = new JwtSecurityTokenHandler().WriteToken(tokenOptions);

            return Ok(new UserLoginResponseDto { IsAuthSuccessful = true, Token = token, Username = user.UserName });
        }
    }
}

public class CaptchaResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }
    public string[] ErrorCodes { get; set; }
}
