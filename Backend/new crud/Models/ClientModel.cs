using System.Collections.ObjectModel;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace new_crud.Models
{
    public class ClientModel
    {
        [Key]
        public long Id { get; set; }
        [Required]
        public string? Name { get; set; }

        [Required]
        public string? Email { get; set; }
        public Collection<ProjectModel>? Projects { get; set; }
    }
}
