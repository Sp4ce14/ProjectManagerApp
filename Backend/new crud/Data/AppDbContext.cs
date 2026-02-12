using Microsoft.EntityFrameworkCore;
using new_crud.Models;

namespace new_crud.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions options) : base(options)
        {
        }
        public DbSet<ProjectModel> Projects { get; set; }
        public DbSet<TaskModel> Tasks{ get; set; }
        public DbSet<ClientModel> Clients { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<TaskModel>().HasOne(p => p.Project)
                .WithMany(p => p.Tasks)
                .HasForeignKey(p => p.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProjectModel>().Property(p => p.Deadline)
                .HasColumnType("date");

        }
    }
}
