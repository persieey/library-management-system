import seal from "../assets/logo.png";
import iconFacebook from "../assets/icons/social-facebook.svg";
import iconInstagram from "../assets/icons/social-instagram.svg";
import iconYoutube from "../assets/icons/social-youtube.svg";
import iconLine from "../assets/icons/social-line.svg";

const SOCIALS = [
  { label: "Facebook", icon: iconFacebook },
  { label: "Instagram", icon: iconInstagram },
  { label: "YouTube", icon: iconYoutube },
  { label: "Line", icon: iconLine },
];

function Divider() {
  return <div className="mt-[4px] h-[200px] w-[2px] shrink-0 bg-white" />;
}

function Footer() {
  return (
    <footer className="w-full bg-brand-green">
      <div className="mx-auto flex h-[252px] max-w-[1440px] items-start px-[83px] pt-[25px]">
        <img src={seal} alt="" className="h-[160px] w-[160px] shrink-0 object-contain" />

        <div className="ml-[94px] w-[247px] shrink-0 pt-[25px] font-kanit text-[18px] leading-[33px] text-white">
          <p>Library Opening Hours</p>
          <p>Mon. - Sat. : 8:00 - 20:00</p>
          <p>Public Holidays : Closed</p>
          <p>Sun. : Closed</p>
        </div>

        <div className="ml-[42px]">
          <Divider />
        </div>

        <div className="ml-[59px] w-[359px] shrink-0 pt-[25px] font-kanit text-[18px] leading-[33px] text-white">
          <p>Contact Us :</p>
          <p>&nbsp;</p>
          <p>Phone : 02 875 9874&nbsp;&nbsp;&nbsp;&nbsp;ext. 9999</p>
          <p>E-mail : library@uu.ac.th</p>
        </div>

        <div className="ml-[18px]">
          <Divider />
        </div>

        <div className="ml-[87px] flex flex-col gap-[14px] pt-[30px]">
          {SOCIALS.map((social) => (
            <a key={social.label} href="/" className="flex items-center gap-[9px]">
              <img src={social.icon} alt="" className="h-[18px] w-[18px]" />
              <span className="font-kanit text-[18px] leading-none text-white">{social.label}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="h-[48px] w-full bg-black">
        <div className="mx-auto flex h-full max-w-[1440px] items-center px-[321px]">
          <p className="font-kanit text-[18px] text-white">
            © 2026 UU Library and Learning Space. All rights reserved. | All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
