using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using new_crud.Data;
using new_crud.Models;
using new_crud.DTOs;
using System.Collections.ObjectModel;
using System.IO;


namespace new_crud.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CRUDController : ControllerBase
    {
        private AppDbContext _context;
        public CRUDController(AppDbContext context) { 
            _context = context;
        }

        [HttpGet("Filter")]
        public async Task<IActionResult> GetFilteredProjects([FromQuery] FilterPagDto filters)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest("One of the validation errors occured");
            }
            var query = _context.Projects.AsQueryable().AsNoTracking();
            if (filters.ClientId != null) query = query.Where(p => p.ClientId == filters.ClientId);
            if (filters.From != null) query = query.Where(p => p.Deadline >= filters.From);
            if (filters.To != null) query = query.Where(p => p.Deadline <= filters.To);
            if (filters.Status.HasValue) query = query.Where(p => p.Status == filters.Status);
            if (!String.IsNullOrEmpty(filters.SearchTerm)) query = query.Where(p => p.Name.ToLower().Contains(filters.SearchTerm.ToLower()) || p.Client.Name.ToLower().Contains(filters.SearchTerm.ToLower()));
            var totalCount = await query.CountAsync();
            var offset = (filters.CurrentPage - 1) * filters.PageSize;
            query = query.OrderBy(p => p.Id).Skip(offset).Take(filters.PageSize);
            List<ProjectDTO> projects = await query.Select(p => new ProjectDTO
            {
                Name = p.Name,
                Id = p.Id,
                Status = p.Status,
                ClientName = p.Client.Name,
                ClientId = p.Client.Id,
                Deadline = p.Deadline,
                Tasks = p.Tasks.Select(t => new TaskDTO
                {
                    Id = t.Id,
                    Title = t.Title,
                    AssignedUser = t.AssignedUser,
                    DueDate = t.DueDate,
                    IsCompleted = t.IsCompleted,
                }).ToList()
            }).ToListAsync();
            GetResponseDto responseObj = new()
            {
                TotalFoundRecords = totalCount,
                Projects = projects
            };
            return Ok(responseObj);
        }

        [HttpGet("Clients")]
        public async Task<IActionResult> GetClients()
        {
            var clients = await _context.Clients.AsNoTracking().ToListAsync();
            return Ok(clients);
        }

        [HttpGet("Projects/{id}")]
        public async Task<IActionResult> GetProject(int? id)
        {
            var project = await _context.Projects.Select(p => new ProjectDTO
            {
                Name = p.Name,
                Id = p.Id,
                Status = p.Status,
                ClientName = p.Client.Name,
                ClientId = p.Client.Id,
                Deadline = p.Deadline,
                ImageUrl = p.ImageUrl,
                Tasks = p.Tasks.Select(t => new TaskDTO
                {
                    Id = t.Id,
                    Title = t.Title,
                    AssignedUser = t.AssignedUser,
                    DueDate = t.DueDate,
                    IsCompleted = t.IsCompleted,
                }).ToList()
            }).FirstOrDefaultAsync(p => p.Id == id);

            if (id == null || project == null)
            {
                return BadRequest();
            }
            return Ok(project);
        }

        [HttpPost("Project")]
        public async Task<IActionResult> AddProject([FromForm] ProjectDTO projectDto)
        {
            var image = projectDto.Image;

            if (!projectDto.ClientId.HasValue)
                return BadRequest("ClientId is required.");

            if (image == null || image.Length == 0)
                return BadRequest("No file uploaded.");

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var ext = Path.GetExtension(image.FileName).ToLower();
            if (!allowedExtensions.Contains(ext))
                return BadRequest("Invalid file type.");

            // Validate file size (5 MB max)
            if (image.Length > 5 * 1024 * 1024)
                return BadRequest("File too large.");

            // Prepare folder path
            var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/images");
            if (!Directory.Exists(folderPath))
                Directory.CreateDirectory(folderPath); // create folder if missing

            // Generate unique filename to avoid collisions
            var fileName = Guid.NewGuid().ToString() + ext;
            var filePath = Path.Combine(folderPath, fileName);

            // Save file to disk
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await image.CopyToAsync(stream);
            }

            // Build public URL for frontend
            var imageUrl = $"{Request.Scheme}://{Request.Host}/images/{fileName}";
            projectDto.ImageUrl = imageUrl;
            // Save in database
            var project = new ProjectModel
            {
                Name = projectDto.Name,
                Status = projectDto.Status,
                Deadline = projectDto.Deadline,
                ImageUrl = imageUrl,
                ClientId = (long)projectDto.ClientId,
                Tasks = new Collection<TaskModel>()
            };
            if (projectDto.Tasks != null)
            {
                foreach (var task in projectDto.Tasks)
                {
                    project.Tasks.Add(new TaskModel
                    {
                        Title = task.Title,
                        AssignedUser = task.AssignedUser,
                        DueDate = task.DueDate,
                        IsCompleted = task.IsCompleted,
                    });
                }
            }
            await _context.AddAsync(project);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetProject), new { id = project.Id }, projectDto);
        }

        [HttpPost("Client")]
        public async Task<IActionResult> AddClient([FromBody] ClientDTO clientDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var client = new ClientModel
            {
                Email = clientDto.Email,
                Name = clientDto.Name
            };
            await _context.AddAsync(client);
            await _context.SaveChangesAsync();
            return Ok(new { id = client.Id});
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Edit(int? id, [FromForm] ProjectDTO project)
        {
            if (id == null)
            {
                return BadRequest();
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var toEdit = await _context.Projects.Where(p => p.Id == id).Include(p => p.Tasks).Include(p => p.Client).FirstOrDefaultAsync();
            if (toEdit == null)
            {
                return NotFound();
            }
            if (!project.ClientId.HasValue)
                return BadRequest("ClientId is required.");

            if (project.Image != null && project.Image.Length != 0)
            {
                var image = project.Image;

                // Validate file type
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                var ext = Path.GetExtension(image.FileName).ToLower();
                if (!allowedExtensions.Contains(ext))
                    return BadRequest("Invalid file type.");

                // Validate file size (5 MB max)
                if (image.Length > 5 * 1024 * 1024)
                    return BadRequest("File too large.");

                // Prepare folder path
                var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/images");
                if (!Directory.Exists(folderPath))
                    Directory.CreateDirectory(folderPath); // create folder if missing
                // Delete existing image if new image is sent
                if (toEdit.ImageUrl != null)
                {
                    var uri = new Uri(toEdit.ImageUrl);
                    var existingImage = Path.Combine(folderPath, Path.GetFileName(uri.LocalPath));
                    if (System.IO.File.Exists(existingImage))
                    {
                        System.IO.File.Delete(existingImage);
                    }
                }
                    // Generate unique filename to avoid collisions
                    var fileName = Guid.NewGuid().ToString() + ext;
                var filePath = Path.Combine(folderPath, fileName);

                // Save file to disk
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await image.CopyToAsync(stream);
                }

                // Build public URL for frontend
                var imageUrl = $"{Request.Scheme}://{Request.Host}/images/{fileName}";
                toEdit.ImageUrl = imageUrl;
            }
            toEdit.Status = project.Status;
            toEdit.Name = project.Name;
            toEdit.Deadline = project.Deadline;
            if (project.ClientId != null)
            {
                toEdit.ClientId = (long)project.ClientId;
            }
            //toEdit.Client.Name = await _context.Clients.Where(c => c.Id == project.ClientId).Select(c => c.Name).FirstOrDefaultAsync();
            //toEdit.Client.Email = await _context.Clients.Where(c => c.Id == project.ClientId).Select(c => c.Email).FirstOrDefaultAsync();
            if (toEdit.Tasks != null)
            {
                toEdit.Tasks.Clear();
                if (project.Tasks != null)
                {
                    foreach (var t in project.Tasks)
                    {
                        toEdit.Tasks.Add(new TaskModel
                        {
                            Title = t.Title,
                            AssignedUser = t.AssignedUser,
                            DueDate = t.DueDate,
                            IsCompleted = t.IsCompleted
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            var toDel = await _context.Projects.FindAsync(id);
            if (toDel == null)
            {
                return NotFound();
            }
            _context.Projects.Remove(toDel);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
