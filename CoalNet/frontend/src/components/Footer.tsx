import { Leaf, Github, Twitter, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-muted/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">CoalNet Zero</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Powering India's journey to sustainable coal mining through intelligent emission management
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-primary smooth-transition cursor-pointer">Features</li>
              <li className="hover:text-primary smooth-transition cursor-pointer">Dashboard</li>
              <li className="hover:text-primary smooth-transition cursor-pointer">Analytics</li>
              <li className="hover:text-primary smooth-transition cursor-pointer">Pricing</li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-semibold">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-primary smooth-transition cursor-pointer">About Us</li>
              <li className="hover:text-primary smooth-transition cursor-pointer">Careers</li>
              <li className="hover:text-primary smooth-transition cursor-pointer">Contact</li>
              <li className="hover:text-primary smooth-transition cursor-pointer">Blog</li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h3 className="font-semibold">Connect</h3>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground smooth-transition">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground smooth-transition">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground smooth-transition">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground smooth-transition">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} CoalNet Zero. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary smooth-transition">Privacy Policy</a>
            <a href="#" className="hover:text-primary smooth-transition">Terms of Service</a>
            <a href="#" className="hover:text-primary smooth-transition">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
