using System.Collections.ObjectModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace new_crud.Models
{
    public class ProjectModel
    {
        public long Id { get; set; }
        [Required]
        public string? Name { get; set; }
        [Required]
        public DateTime Deadline { get; set; }
        [Required]
        public bool Status { get; set; }
        public string? ImageUrl { get; set; }
        public long ClientId { get; set; }
        [ForeignKey("ClientId")]
        public ClientModel? Client { get; set; }
        public Collection<TaskModel>? Tasks { get; set; }
    }
}
