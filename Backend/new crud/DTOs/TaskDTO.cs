using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace new_crud.DTOs
{
    public class TaskDTO
    {
        public long Id { get; set; }
        [Required]
        public string? Title { get; set; }
        [Required]
        public string? AssignedUser { get; set; }
        [Required]
        public DateTime DueDate { get; set; }
        [Required]
        public bool IsCompleted { get; set; }
    }
}