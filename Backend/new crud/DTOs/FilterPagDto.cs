using System.ComponentModel.DataAnnotations;

namespace new_crud.DTOs
{
    public class FilterPagDto
    {
        public long? ClientId { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
        public bool? Status { get; set; }
        public string? SearchTerm { get; set; }
        [Required]
        public int CurrentPage { get; set; }
        [Required]
        public int PageSize { get; set; }
    }
}
