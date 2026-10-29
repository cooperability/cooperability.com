import { History, Microscope } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import InlineIcon from '../InlineIcon'

interface Reference {
  cite: string
  title: string
  venue: string
  url: string
}

const REFERENCES: Reference[] = [
  {
    cite: 'Monk, E. (2019).',
    title: 'Monk Skin Tone Scale.',
    venue: 'Released by Google in 2022 under CC BY 4.0.',
    url: 'https://skintone.google/',
  },
  {
    cite: 'Heldreth, C. M., Monk, E. P., Clark, A. T., Schumann, C., Eyee, X., & Ricco, S. (2024).',
    title:
      'Which Skin Tone Measures Are the Most Inclusive? An Investigation of Skin Tone Measures for Artificial Intelligence.',
    venue: 'ACM Journal on Responsible Computing, 1(1), 1–21.',
    url: 'https://doi.org/10.1145/3632120',
  },
  {
    cite: 'Perrett, D. I., & Sprengelmeyer, R. (2021).',
    title:
      'Clothing Aesthetics: Consistent Colour Choices to Match Fair and Tanned Skin Tones.',
    venue: 'i-Perception, 12(6).',
    url: 'https://doi.org/10.1177/20416695211053361',
  },
  {
    cite: 'Radeloff, D. J. (1990).',
    title: 'Role of Color in Perception of Attractiveness.',
    venue: 'Perceptual and Motor Skills, 71(1), 151–160.',
    url: 'https://doi.org/10.2466/pms.1990.71.1.151',
  },
  {
    cite: 'ณัฐพัชร์ ศิริภาธนพัฒน์ (2020).',
    title:
      'การวิเคราะห์หาสีของเสื้อผ้าที่เหมาะสมกับสีผิว [Analysis of clothing colors suited to skin tone].',
    venue:
      'Senior project, Imaging and Printing Technology, Chulalongkorn University.',
    url: 'https://doi.org/10.58837/CHULA.SP.2020.312',
  },
  {
    cite: 'Maybelline.',
    title: 'How to find your skin undertone.',
    venue: 'Makeup tips.',
    url: 'https://www.maybelline.co.uk/makeup-tips/how-to-find-your-skin-undertone',
  },
  {
    cite: 'Wikipedia.',
    title: 'Color analysis (history of Itten, Kentner, Caygill and Jackson).',
    venue: 'Retrieved October 2026.',
    url: 'https://en.wikipedia.org/wiki/Color_analysis',
  },
]

const heading = 'mb-2 font-semibold text-gray-900 dark:text-gray-100'

export default function SwatchNotes() {
  return (
    <Accordion type="single" collapsible className="w-full space-y-2">
      <AccordionItem value="research">
        <AccordionTrigger>
          <span>
            <InlineIcon icon={Microscope} />
            Why it is built this way
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 leading-relaxed">
          <div>
            <h3 className={heading}>Skin is depth plus undertone</h3>
            <p>
              Depth uses the Monk Skin Tone Scale, ten tones from sociologist
              Ellis Monk that Google released openly in 2022. In a survey of
              2,214 people in the US, respondents rated it no less inclusive
              than Fenty Beauty’s 40-shade range and more inclusive than the
              six-type Fitzpatrick scale (Heldreth et al.). The scale records
              depth only, not undertone, so undertone is its own pick, in the
              cool, neutral and warm terms undertone guides use, plus olive, a
              common fourth.
            </p>
          </div>
          <div>
            <h3 className={heading}>Seasons are a switch</h3>
            <p>
              The evidence for seasonal analysis is thin. Radeloff’s 276
              observers agreed with experts’ recommended colors in five of six
              photo sets. In a 2020 Chulalongkorn student project with 35
              subjects, observers’ season picks matched the researcher’s 40% of
              the time. A narrower result holds up better: on White women’s
              faces, Perrett and Sprengelmeyer’s observers chose cool blues for
              fair skin and warm orange-reds for tanned skin. So the season is
              an option, and the page works without it.
            </p>
          </div>
          <div>
            <h3 className={heading}>Colors from your own features</h3>
            <p>
              The harmonies start from what you picked: echoes of your eye and
              hair colors, the eye color’s complement as an accent, a nude a
              shade deeper than your skin, and a flush that turns rose for cool
              undertones and coral for warm ones, the same split undertone
              guides give for lipstick. Metals follow the guides’ silver for
              cool and gold for warm, with platinum and brass as close cousins.
            </p>
          </div>
          <div className="border-t pt-4">
            <h3 className={heading}>References</h3>
            <ul className="space-y-2 text-xs">
              {REFERENCES.map((r) => (
                <li key={r.url}>
                  {r.cite} {r.title} <em>{r.venue}</em>{' '}
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
                  >
                    {r.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="history">
        <AccordionTrigger>
          <span>
            <InlineIcon icon={History} />
            Where seasonal color analysis comes from
          </span>
        </AccordionTrigger>
        <AccordionContent className="leading-relaxed">
          <p>
            Bauhaus teacher Johannes Itten tied people’s preferred colors to the
            four seasons in <em>The Art of Color</em> (1961). Bernice Kentner’s{' '}
            <em>Color Me a Season</em> (1978) followed, then Suzanne Caygill’s{' '}
            <em>Color: The Essence of You</em> and Carole Jackson’s{' '}
            <em>Color Me Beautiful</em>, both in 1980. Twelve-season systems
            such as Sci\ART later split each season in three, giving names like
            Dark Winter. In-person analysts send clients home with a fan or
            wallet of fabric swatches. This page is a quick, self-reported
            version of that fan.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
