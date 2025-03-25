using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Models
{
    public class Class
    {
        [Key]
        public int Id { get; set; }
        public string Chess_Opening { get; set; }

    }
}
