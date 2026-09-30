import { Github, Twitter, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t mt-auto">
      <div className="flex flex-col xs:flex-row items-center justify-between gap-4 p-4 xs:p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">Base64 Converter</span>
          <span>·</span>
          <span>© {currentYear}</span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/donezombie"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
          <a
            href="https://twitter.com/donezombie"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="h-5 w-5" />
          </a>
          <a
            href="mailto:donezombie@gmail.com"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Email"
          >
            <Mail className="h-5 w-5" />
          </a>
        </div>

        <div className="text-xs text-muted-foreground text-center xs:text-right">
          Built with React + TypeScript + Tailwind CSS
        </div>
      </div>
    </footer>
  );
};

export default Footer;