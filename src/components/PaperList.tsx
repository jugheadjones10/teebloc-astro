interface Paper {
  id: string;
  title: string;
  year: string;
  type: string;
  subject: string;
  school: string;
  level: string;
  s3_url: string;
}

interface PaperListProps {
  papers: Paper[];
}

export default function PaperList({ papers }: PaperListProps) {
  console.log(papers);
  return (
    <div>
      {papers.map((paper) => (
        <div key={paper.id}>
          <a
            target="_blank"
            className="text-blue-600 hover:text-blue-800 underline"
            href={`https://pyps.s3.ap-southeast-1.amazonaws.com/${paper.s3_url}`}>
            {paper.level} {paper.subject} {paper.year} {paper.type}{" "}
            {paper.school}
          </a>
        </div>
      ))}
    </div>
  );
}
