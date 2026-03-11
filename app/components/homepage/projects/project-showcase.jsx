import SingleProject from "./single-project";
import ProjectCard from "./project-card";

const ProjectShowcase = ({ project, index }) => {

  const reverse = index % 2 !== 0;

  return (
    <div className={`grid md:grid-cols-2 gap-10 items-center w-full ${reverse ? "md:flex-row-reverse" : ""}`}>
      
      {reverse ? (
        <>
          <ProjectCard project={project} />
          <SingleProject project={project} />
        </>
      ) : (
        <>
          <SingleProject project={project} />
          <ProjectCard project={project} />
        </>
      )}

    </div>
  );
};

export default ProjectShowcase;