using System.Collections.ObjectModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace new_crud.DTOs
{
    public class ProjectDTO
    {
        public long Id { get; set; }
        [Required]
        public string? Name { get; set; }
        [Required]
        public DateTime Deadline { get; set; }
        [Required]
        public bool Status { get; set; }
        public string? ImageUrl { get; set; }
        public IFormFile? Image { get; set; }
        public long? ClientId { get; set; }
        public string? ClientName { get; set; }
        public List<TaskDTO>? Tasks { get; set; }
    }
}
