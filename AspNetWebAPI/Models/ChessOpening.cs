using System.ComponentModel.DataAnnotations;

namespace AspNetCoreAPI.Models
{
    public class ChessOpening
    {
        [Key]
        public int Id { get; set; }

        public string? Name { get; set; }

        public string? Description { get; set; }

    }
}
