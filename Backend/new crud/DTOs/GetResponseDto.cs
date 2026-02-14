namespace new_crud.DTOs
{
    public class GetResponseDto
    {
        public int TotalFoundRecords { get; set; }
        public List<ProjectDTO>? Projects { get; set; } 
    }
}
