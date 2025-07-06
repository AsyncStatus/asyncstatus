import {
  LegalDate,
  LegalDivider,
  LegalDocument,
  LegalHeading,
  LegalLink,
  LegalList,
  LegalListItem,
  LegalListRoman,
  LegalParagraph,
  LegalSection,
  LegalSmallHeading,
  LegalStrong,
  LegalSubheading,
} from "@asyncstatus/ui/components/legal-text";
import { SimpleLayout } from "@asyncstatus/ui/components/simple-layout";

export default function Page() {
  return (
    <LegalDocument>
      <LegalHeading>AsyncStatus Privacy Policy</LegalHeading>
      <LegalParagraph>
        Your privacy is important to us. It is AsyncStatus's policy to respect your privacy and
        comply with any applicable law and regulation regarding any personal information we may
        collect about you, including across our website,{" "}
        <LegalLink href="https://asyncstatus.com">https://asyncstatus.com</LegalLink>, and other
        sites we own and operate.
      </LegalParagraph>
      <LegalParagraph>
        Personal information is any information about you which can be used to identify you. This
        includes information about you as a person (such as name, address, and date of birth), your
        devices, payment details, and even information about how you use a website or online
        service.
      </LegalParagraph>
      <LegalParagraph>
        In the event our site contains links to third-party sites and services, please be aware that
        those sites and services have their own privacy policies. After following a link to any
        third-party content, you should read their posted privacy policy information about how they
        collect and use personal information. This Privacy Policy does not apply to any of your
        activities after you leave our site.
      </LegalParagraph>
      <LegalParagraph>This policy is effective as of December 29, 2024</LegalParagraph>
      <LegalParagraph>Last updated: March 10, 2025</LegalParagraph>

      <LegalSubheading>Information We Collect</LegalSubheading>
      <LegalParagraph>
        Information we collect falls into one of two categories: "voluntarily provided" information
        and "automatically collected" information.
      </LegalParagraph>
      <LegalParagraph>
        "Voluntarily provided" information refers to any information you knowingly and actively
        provide us when using or participating in any of our services and promotions.
      </LegalParagraph>
      <LegalParagraph>
        "Automatically collected" information refers to any information automatically sent by your
        devices in the course of accessing our products and services.
      </LegalParagraph>

      <LegalSubheading>Log Data</LegalSubheading>
      <LegalParagraph>
        When you visit our website, our servers may automatically log the standard data provided by
        your web browser. It may include your device’s Internet Protocol (IP) address, your browser
        type and version, the pages you visit, the time and date of your visit, the time spent on
        each page, and other details about your visit.
      </LegalParagraph>
      <LegalParagraph>
        Additionally, if you encounter certain errors while using the site, we may automatically
        collect data about the error and the circumstances surrounding its occurrence. This data may
        include technical details about your device, what you were trying to do when the error
        happened, and other technical information relating to the problem. You may or may not
        receive notice of such errors, even in the moment they occur, that they have occurred, or
        what the nature of the error is.
      </LegalParagraph>
      <LegalParagraph>
        Please be aware that while this information may not be personally identifying by itself, it
        may be possible to combine it with other data to personally identify individual persons.
      </LegalParagraph>

      <LegalSubheading>Personal Information</LegalSubheading>
      <LegalParagraph>
        We may ask for personal information - for example when you subscribe to our newsletter, when
        you register an account - which may include one or more of the following:
      </LegalParagraph>

      <LegalList>
        <LegalListItem>Name</LegalListItem>
        <LegalListItem>Email</LegalListItem>
      </LegalList>

      <LegalSubheading>Legitimate Reasons for Processing Your Personal Information</LegalSubheading>
      <LegalParagraph>
        We only collect and use your personal information when we have a legitimate reason for doing
        so. In which instance, we only collect personal information that is reasonably necessary to
        provide our services to you.
      </LegalParagraph>

      <LegalList>
        <LegalListItem>No content</LegalListItem>
      </LegalList>

      <LegalSubheading>Collection and Use of Information</LegalSubheading>
      <LegalParagraph>
        We may collect personal information from you when you do any of the following on our
        website:
      </LegalParagraph>
      <LegalList>
        <LegalListItem>Register for an account</LegalListItem>
        <LegalListItem>Purchase a subscription</LegalListItem>
        <LegalListItem>
          Sign up to receive updates from us via email or social media channels
        </LegalListItem>
        <LegalListItem>Use a mobile device or web browser to access our content</LegalListItem>
        <LegalListItem>
          Contact us via email, social media, or on any similar technologies
        </LegalListItem>
        <LegalListItem>When you mention us on social media</LegalListItem>
      </LegalList>
      <LegalParagraph>
        We may collect, hold, use, and disclose information for the following purposes, and personal
        information will not be further processed in a manner that is incompatible with these
        purposes:
      </LegalParagraph>
      <LegalList>
        <LegalListItem>to provide you with our platform's core features and services</LegalListItem>
        <LegalListItem>to contact and communicate with you</LegalListItem>
        <LegalListItem>
          to enable you to access and use our website, associated applications, and associated
          social media platforms
        </LegalListItem>
        <LegalListItem>for internal record keeping and administrative purposes</LegalListItem>
        <LegalListItem>
          to comply with our legal obligations and resolve any disputes that we may have
        </LegalListItem>
        <LegalListItem>
          for security and fraud prevention, and to ensure that our sites and apps are safe, secure,
          and used in line with our terms of use
        </LegalListItem>
        <LegalListItem>
          for technical assessment, including to operate and improve our app, associated
          applications, and associated social media platforms
        </LegalListItem>
      </LegalList>
      <LegalParagraph>
        We may combine voluntarily provided and automatically collected personal information with
        general information or research data we receive from other trusted sources. For example, If
        you provide us with your location, we may combine this with general information about
        currency and language to provide you with an enhanced experience of our site and service.
      </LegalParagraph>

      <LegalSubheading>Security of Your Personal Information</LegalSubheading>
      <LegalParagraph>
        When we collect and process personal information, and while we retain this information, we
        will protect it within commercially acceptable means to prevent loss and theft, as well as
        unauthorized access, disclosure, copying, use or modification.
      </LegalParagraph>
      <LegalParagraph>
        Although we will do our best to protect the personal information you provide to us, we
        advise that no method of electronic transmission or storage is 100% secure and no one can
        guarantee absolute data security.
      </LegalParagraph>
      <LegalParagraph>
        You are responsible for selecting any password and its overall security strength, ensuring
        the security of your own information within the bounds of our services. For example,
        ensuring any passwords associated with accessing your personal information and accounts are
        secure and confidential.
      </LegalParagraph>

      <LegalSmallHeading>How Long We Keep Your Personal Information</LegalSmallHeading>
      <LegalParagraph>
        We keep your personal information only for as long as we need to. This time period may
        depend on what we are using your information for, in accordance with this privacy policy.
        For example, if you have provided us with personal information as part of creating an
        account with us, we may retain this information for the duration your account exists on our
        system. If your personal information is no longer required for this purpose, we will delete
        it or make it anonymous by removing all details that identify you.
      </LegalParagraph>
      <LegalParagraph>
        However, if necessary, we may retain your personal information for our compliance with a
        legal, accounting, or reporting obligation or for archiving purposes in the public interest,
        scientific, or historical research purposes or statistical purposes.
      </LegalParagraph>

      <LegalSubheading>Children’s Privacy</LegalSubheading>
      <LegalParagraph>
        We do not aim any of our products or services directly at children under the age of 13 and
        we do not knowingly collect personal information about children under 13.
      </LegalParagraph>

      <LegalSubheading>Disclosure of Personal Information to Third Parties</LegalSubheading>
      <LegalParagraph>We may disclose personal information to:</LegalParagraph>
      <LegalList>
        <LegalListItem>a parent, subsidiary or affiliate of our company</LegalListItem>
        <LegalListItem>
          third-party service providers for the purpose of enabling them to provide their services,
          including (without limitation) IT service providers, data storage, hosting and server
          providers, analytics, error loggers, debt collectors, maintenance or problem-solving
          providers, professional advisors, and payment systems operators
        </LegalListItem>
        <LegalListItem>our employees, contractors, and/or related entities</LegalListItem>
        <LegalListItem>our existing or potential agents or business partners</LegalListItem>
        <LegalListItem>
          credit reporting agencies, courts, tribunals, and regulatory authorities, in the event you
          fail to pay for goods or services we have provided to you
        </LegalListItem>
        <LegalListItem>
          courts, tribunals, regulatory authorities, and law enforcement officers, as required by
          law, in connection with any actual or prospective legal proceedings, or in order to
          establish, exercise, or defend our legal rights
        </LegalListItem>
        <LegalListItem>
          third parties, including agents or sub-contractors who assist us in providing information,
          products, services, or direct marketing to you
        </LegalListItem>
        <LegalListItem>third parties to collect and process data</LegalListItem>
        <LegalListItem>
          an entity that buys, or to which we transfer all or substantially all of our assets and
          business
        </LegalListItem>
      </LegalList>
      <LegalParagraph>Third parties we currently use include:</LegalParagraph>
      <LegalList>
        <LegalListItem>Stripe</LegalListItem>
      </LegalList>

      <LegalSubheading>Your Rights and Controlling Your Personal Information</LegalSubheading>
      <LegalParagraph>
        <strong>Your choice:</strong> By providing personal information to us, you understand we
        will collect, hold, use, and disclose your personal information in accordance with this
        privacy policy. You do not have to provide personal information to us, however, if you do
        not, it may affect your use of our website or the products and/or services offered on or
        through it.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Information from third parties:</strong> If we receive personal information about
        you from a third party, we will protect it as set out in this privacy policy. If you are a
        third party providing personal information about somebody else, you represent and warrant
        that you have such person’s consent to provide the personal information to us.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Marketing permission:</strong> If you have previously agreed to us using your
        personal information for direct marketing purposes, you may change your mind at any time by
        contacting us using the details below.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Access:</strong> You may request details of the personal information that we hold
        about you.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Correction:</strong> If you believe that any information we hold about you is
        inaccurate, out of date, incomplete, irrelevant, or misleading, please contact us using the
        details provided in this privacy policy. We will take reasonable steps to correct any
        information found to be inaccurate, incomplete, misleading, or out of date.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Non-discrimination:</strong> We will not discriminate against you for exercising any
        of your rights over your personal information. Unless your personal information is required
        to provide you with a particular service or offer (for example processing transaction data),
        we will not deny you goods or services and/or charge you different prices or rates for goods
        or services, including through granting discounts or other benefits, or imposing penalties,
        or provide you with a different level or quality of goods or services.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Downloading of Personal Information:</strong> We provide a means for you to download
        the personal information you have shared through our site. Please contact us for more
        information.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Notification of data breaches:</strong> We will comply with laws applicable to us in
        respect of any data breach.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Complaints:</strong> If you believe that we have breached a relevant data protection
        law and wish to make a complaint, please contact us using the details below and provide us
        with full details of the alleged breach. We will promptly investigate your complaint and
        respond to you, in writing, setting out the outcome of our investigation and the steps we
        will take to deal with your complaint. You also have the right to contact a regulatory body
        or data protection authority in relation to your complaint.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Unsubscribe:</strong> To unsubscribe from our email database or opt-out of
        communications (including marketing communications), please contact us using the details
        provided in this privacy policy, or opt-out using the opt-out facilities provided in the
        communication. We may need to request specific information from you to help us confirm your
        identity.
      </LegalParagraph>

      <LegalSubheading>Use of Cookies</LegalSubheading>
      <LegalParagraph>
        We use "cookies" to collect information about you and your activity across our site. A
        cookie is a small piece of data that our website stores on your computer, and accesses each
        time you visit, so we can understand how you use our site. This helps us serve you content
        based on preferences you have specified.
      </LegalParagraph>
      <LegalParagraph>Please refer to our Cookie Policy for more information.</LegalParagraph>

      <LegalSubheading>Business Transfers</LegalSubheading>
      <LegalParagraph>
        If we or our assets are acquired, or in the unlikely event that we go out of business or
        enter bankruptcy, we would include data, including your personal information, among the
        assets transferred to any parties who acquire us. You acknowledge that such transfers may
        occur, and that any parties who acquire us may, to the extent permitted by applicable law,
        continue to use your personal information according to this policy, which they will be
        required to assume as it is the basis for any ownership or use rights we have over such
        information.
      </LegalParagraph>

      <LegalSubheading>Limits of Our Policy</LegalSubheading>
      <LegalParagraph>
        Our website may link to external sites that are not operated by us. Please be aware that we
        have no control over the content and policies of those sites, and cannot accept
        responsibility or liability for their respective privacy practices.
      </LegalParagraph>

      <LegalSubheading>Changes to This Policy</LegalSubheading>
      <LegalParagraph>
        At our discretion, we may change our privacy policy to reflect updates to our business
        processes, current acceptable practices, or legislative or regulatory changes. If we decide
        to change this privacy policy, we will post the changes here at the same link by which you
        are accessing this privacy policy.
      </LegalParagraph>
      <LegalParagraph>
        If the changes are significant, or if required by applicable law, we will contact you (based
        on your selected preferences for communications from us) and all our registered users with
        the new details and links to the updated or changed policy.
      </LegalParagraph>
      <LegalParagraph>
        If required by law, we will get your permission or give you the opportunity to opt in to or
        opt out of, as applicable, any new uses of your personal information.
      </LegalParagraph>

      <LegalSubheading>
        Additional Disclosures for U.S. States Privacy Law Compliance.
      </LegalSubheading>
      <LegalParagraph>
        The following section includes provisions that comply with the privacy laws of these states
        (California, Colorado, Delaware, Florida, Virginia, and Utah) and is applicable only to the
        residents of those states. Specific references to a particular state (in a heading or in the
        text) are only a reference to that state's law and applies only to that state's residents.
        Non-state specific language applies to all of the states listed above.
      </LegalParagraph>
      <LegalSmallHeading>Do Not Track</LegalSmallHeading>
      <LegalParagraph>
        Some browsers have a "Do Not Track" feature that lets you tell websites that you do not want
        to have your online activities tracked. At this time, we do not respond to browser "Do Not
        Track" signals.
      </LegalParagraph>
      <LegalParagraph>
        We adhere to the standards outlined in this privacy policy, ensuring we collect and process
        personal information lawfully, fairly, transparently, and with legitimate, legal reasons for
        doing so.
      </LegalParagraph>
      <LegalSmallHeading>Cookies and Pixels</LegalSmallHeading>
      <LegalParagraph>
        At all times, you may decline cookies from our site if your browser permits. Most browsers
        allow you to activate settings on your browser to refuse the setting of all or some cookies.
        Accordingly, your ability to limit cookies is based only on your browser’s capabilities.
        Please refer to the Cookies section of this privacy policy for more information.
      </LegalParagraph>
      <LegalSmallHeading>California Privacy Laws - CPPA</LegalSmallHeading>
      <LegalParagraph>
        Under California Civil Code Section 1798.83, if you live in California and your business
        relationship with us is mainly for personal, family, or household purposes, you may ask us
        about the information we release to other organizations for their marketing purposes. In
        accordance with your right to non-discrimination, we may offer you certain financial
        incentives permitted by the California Consumer Privacy Act, and the California Privacy
        Rights Act (collectively, CCPA) that can result in different prices, rates, or quality
        levels for the goods or services we provide. Any CCPA-permitted financial incentive we offer
        will reasonably relate to the value of your personal information, and we will provide
        written terms that describe clearly the nature of such an offer. Participation in a
        financial incentive program requires your prior opt-in consent, which you may revoke at any
        time.
      </LegalParagraph>
      <LegalParagraph>
        Under California Civil Code Section 1798.83, if you live in California and your business
        relationship with us is mainly for personal, family, or household purposes, you may ask us
        about the information we release to other organizations for their marketing purposes. To
        make such a request, please contact us using the details provided in this privacy policy
        with “Request for California privacy information” in the subject line. You may make this
        type of request once every calendar year. We will email you a list of categories of personal
        information we revealed to other organisations for their marketing purposes in the last
        calendar year, along with their names and addresses. Not all personal information shared in
        this way is covered by Section 1798.83 of the California Civil Code.
      </LegalParagraph>
      <LegalSmallHeading>California Notice of Collection</LegalSmallHeading>
      <LegalParagraph>
        In the past 12 months, we have collected the following categories of personal information
        enumerated in the CCPA:
      </LegalParagraph>
      <LegalList>
        <LegalListItem>
          Identifiers, such as name, email address, phone number, account name, IP address, and an
          ID or number assigned to your account.
        </LegalListItem>
      </LegalList>
      <LegalParagraph>
        For more information on information we collect, including the sources we receive information
        from, review the “Information We Collect” section. We collect and use these categories of
        personal information for the business purposes described in the “Collection and Use of
        Information” section, including to provide and manage our Service.
      </LegalParagraph>
      <LegalSmallHeading>Right to Know and Delete</LegalSmallHeading>
      <LegalParagraph>
        You have rights to delete your personal information we collected and know certain
        information about our data practices in the preceding 12 months. In particular, you have the
        right to request the following from us:
      </LegalParagraph>
      <LegalList>
        <LegalListItem>
          The categories of personal information we have collected about you;
        </LegalListItem>
        <LegalListItem>
          The categories of sources from which the personal information was collected;
        </LegalListItem>
        <LegalListItem>
          The categories of personal information about you we disclosed for a business purpose or
          sold;
        </LegalListItem>
        <LegalListItem>
          The categories of third parties to whom the personal information was disclosed for a
          business purpose or sold;
        </LegalListItem>
        <LegalListItem>
          The business or commercial purpose for collecting or selling the personal information; and
        </LegalListItem>
        <LegalListItem>
          The specific pieces of personal information we have collected about you.
        </LegalListItem>
      </LegalList>
      <LegalParagraph>
        To exercise any of these rights, please contact us using the details provided in this
        privacy policy.
      </LegalParagraph>
      <LegalSmallHeading>Shine the Light</LegalSmallHeading>
      <LegalParagraph>
        In addition to the rights discussed above, you have the right to request information from us
        regarding the manner in which we share certain personal information as defined by applicable
        statute with third parties and affiliates for their own direct marketing purposes.
      </LegalParagraph>
      <LegalParagraph>
        To receive this information, send us a request using the contact details provided in this
        privacy policy. Requests must include “Privacy Rights Request” in the first line of the
        description and include your name, street address, city, state, and ZIP code.
      </LegalParagraph>
      <LegalSubheading>
        Additional Disclosures for General Data Protection Regulation (GDPR) Compliance (EU)
      </LegalSubheading>
      <LegalSmallHeading>Data Controller / Data Processor</LegalSmallHeading>
      <LegalParagraph>
        The GDPR distinguishes between organizations that process personal information for their own
        purposes (known as "data controllers") and organizations that process personal information
        on behalf of other organizations (known as "data processors"). We, AsyncStatus, located at
        the address provided in our Contact Us section, are a Data Controller and/or Processor with
        respect to the personal information you provide to us.
      </LegalParagraph>
      <LegalSmallHeading>Legal Bases for Processing Your Personal Information</LegalSmallHeading>
      <LegalParagraph>
        We will only collect and use your personal information when we have a legal right to do so.
        In which case, we will collect and use your personal information lawfully, fairly, and in a
        transparent manner. If we seek your consent to process your personal information, and you
        are under 16 years of age, we will seek your parent or legal guardian’s consent to process
        your personal information for that specific purpose.
      </LegalParagraph>
      <LegalParagraph>
        Our lawful bases depend on the services you use and how you use them. This means we only
        collect and use your information on the following grounds:
      </LegalParagraph>
      <LegalSmallHeading>Consent From You</LegalSmallHeading>
      <LegalParagraph>
        Where you give us consent to collect and use your personal information for a specific
        purpose. You may withdraw your consent at any time using the facilities we provide; however
        this will not affect any use of your information that has already taken place. When you
        contact us, you may consent to your name and email address being used so we can respond to
        your enquiry. While you may request that we delete your contact details at any time, we
        cannot recall any email we have already sent. If you have any further enquiries about how to
        withdraw your consent, please feel free to enquire using the details provided in the Contact
        Us section of this privacy policy.
      </LegalParagraph>
      <LegalSubheading>Performance of a Contract or Transaction</LegalSubheading>
      <LegalParagraph>
        Where you have entered into a contract or transaction with us, or in order to take
        preparatory steps prior to our entering into a contract or transaction with you. For
        example, if you contact us with an enquiry, we may require personal information such as your
        name and contact details in order to respond.
      </LegalParagraph>
      <LegalSubheading>Our Legitimate Interests</LegalSubheading>
      <LegalParagraph>
        Where we assess it is necessary for our legitimate interests, such as for us to provide,
        operate, improve and communicate our services. We consider our legitimate interests to
        include research and development, understanding our audience, marketing and promoting our
        services, measures taken to operate our services efficiently, marketing analysis, and
        measures taken to protect our legal rights and interests.
      </LegalParagraph>
      <LegalSubheading>Compliance with Law</LegalSubheading>
      <LegalParagraph>
        In some cases, we may have a legal obligation to use or keep your personal information. Such
        cases may include (but are not limited to) court orders, criminal investigations, government
        requests, and regulatory obligations. If you have any further enquiries about how we retain
        personal information in order to comply with the law, please feel free to enquire using the
        details provided in the Contact Us section of this privacy policy.
      </LegalParagraph>
      <LegalSmallHeading>
        International Transfers Outside of the European Economic Area (EEA)
      </LegalSmallHeading>
      <LegalParagraph>
        We will ensure that any transfer of personal information from countries in the European
        Economic Area (EEA) to countries outside the EEA will be protected by appropriate
        safeguards, for example by using standard data protection clauses approved by the European
        Commission, or the use of binding corporate rules or other legally accepted means.
      </LegalParagraph>
      <LegalSmallHeading>Your Rights and Controlling Your Personal Information</LegalSmallHeading>
      <LegalParagraph>
        <strong>Restrict:</strong> You have the right to request that we restrict the processing of
        your personal information if:
      </LegalParagraph>
      <ol type="i">
        <LegalListItem>
          you are concerned about the accuracy of your personal information;{" "}
        </LegalListItem>
        <LegalListItem>
          you believe your personal information has been unlawfully processed;{" "}
        </LegalListItem>
        <LegalListItem>
          you need us to maintain the personal information solely for the purpose of a legal claim;
          or
        </LegalListItem>
        <LegalListItem>
          we are in the process of considering your objection in relation to processing on the basis
          of legitimate interests.
        </LegalListItem>
      </ol>
      <LegalParagraph>
        <strong>Objecting to processing:</strong> You have the right to object to processing of your
        personal information that is based on our legitimate interests or public interest. If this
        is done, we must provide compelling legitimate grounds for the processing which overrides
        your interests, rights, and freedoms, in order to proceed with the processing of your
        personal information.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Data portability:</strong> You may have the right to request a copy of the personal
        information we hold about you. Where possible, we will provide this information in CSV
        format or other easily readable machine format. You may also have the right to request that
        we transfer this personal information to a third party.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Deletion:</strong> You may have a right to request that we delete the personal
        information we hold about you at any time, and we will take reasonable steps to delete your
        personal information from our current records. If you ask us to delete your personal
        information, we will let you know how the deletion affects your use of our website or
        products and services. There may be exceptions to this right for specific legal reasons
        which, if applicable, we will set out for you in response to your request. If you terminate
        or delete your account, we will delete your personal information within 30 days of the
        deletion of your account. Please be aware that search engines and similar third parties may
        still retain copies of your personal information that has been made public at least once,
        like certain profile information and public comments, even after you have deleted the
        information from our services or deactivated your account.{" "}
      </LegalParagraph>

      <LegalSubheading>
        Additional Disclosures for Australian Privacy Act Compliance (AU)
      </LegalSubheading>
      <LegalSmallHeading>International Transfers of Personal Information</LegalSmallHeading>
      <LegalParagraph>
        Where the disclosure of your personal information is solely subject to Australian privacy
        laws, you acknowledge that some third parties may not be regulated by the Privacy Act and
        the Australian Privacy Principles in the Privacy Act. You acknowledge that if any such third
        party engages in any act or practice that contravenes the Australian Privacy Principles, it
        would not be accountable under the Privacy Act, and you will not be able to seek redress
        under the Privacy Act.
      </LegalParagraph>
      <LegalSubheading>
        Additional Disclosures for Personal Information Protection and Electronic Documents Act
        (PIPEDA) Compliance (Canada)
      </LegalSubheading>
      <LegalSmallHeading>Additional scope of personal information</LegalSmallHeading>
      <LegalParagraph>
        In accordance with PIPEDA, we broaden our definition of personal information to include any
        information about an individual, such as financial information, information about your
        appearance, your views and opinion (such as those expressed online or through a survey),
        opinions held about you by others, and any personal correspondences you may have with us.
        While this information may not directly identify you, be aware that it may be combined with
        other information to do so.
      </LegalParagraph>
      <LegalParagraph>
        As PIPEDA refers to personal information using the term Personally Identifying Information
        (PII), any references to personal information and PII in this privacy policy, and in
        official communications from AsyncStatus, are intended as equivalent to one another in every
        way, shape and form.
      </LegalParagraph>
      <LegalSmallHeading>Valid Consent</LegalSmallHeading>
      <LegalParagraph>
        Where you give us consent to collect and use your personal information for a specific
        purpose. You may withdraw your consent at any time using the facilities we provide; however
        this will not affect any use of your information that has already taken place. When you
        contact us, we assume your consent based on your positive action of contact, therefore you
        consent to your name and email address being used so we can respond to your enquiry. Under
        PIPEDA, consent is only valid if it is reasonable to expect that an individual to whom the
        organization's activities are directed would understand the nature, purpose, and
        consequences of the collection, use, or disclosure of the personal information to which they
        are consenting.
      </LegalParagraph>
      <LegalParagraph>
        Where you agree to receive marketing communications from us, we will do so based solely on
        your indication of consent or until you instruct us not to, which you can do at any time.
      </LegalParagraph>
      <LegalParagraph>
        While you may request that we delete your contact details at any time, we cannot recall any
        email we have already sent. If you have any further enquiries about how to withdraw your
        consent, please feel free to enquire using the details provided in the Contact Us section of
        this privacy policy.
      </LegalParagraph>
      <LegalSmallHeading>International Transfers of Information</LegalSmallHeading>
      <LegalParagraph>
        While AsyncStatus endeavors to keep, store and handle customer data within locations in
        Canada, it may use agents or service providers located in the United States (U.S.), European
        Economic Area (EEA) or United Kingdom (UK) to collect, use, retain and process personal
        information as part of providing services to you. While we use all reasonable efforts to
        ensure that personal information receives the same level of security in any other
        jurisdiction as it would in Canada, please be aware that privacy protections under U.S. laws
        may not be the same adequacy.
      </LegalParagraph>
      <LegalSmallHeading>Customer Data Rights</LegalSmallHeading>
      <LegalParagraph>
        Although PIPEDA does not contain an extensive set of consumer rights, it does grant
        consumers the right to:
      </LegalParagraph>
      <LegalList>
        <LegalListItem>
          Access the personal information organizations hold about them;
        </LegalListItem>
        <LegalListItem>
          Correct any inaccurate or outdated personal information the organization hold about them
          (or, if this is not possible, delete the inaccurate personal information)
        </LegalListItem>
        <LegalListItem>
          Withdraw consent for any activities for which they have consented (e.g. direct marketing
          or cookies
        </LegalListItem>
      </LegalList>
      <LegalSmallHeading>Right to Withdraw Consent</LegalSmallHeading>
      <LegalParagraph>
        Where you give us consent to collect and use your personal information for a specific
        purpose. Subject to some restrictions, you can, at any time, refuse to consent, or continue
        to consent to the collection, use or disclosure of their personal information by notifying
        us using the email address below in the "Contact Us" section. Withdrawal of consent may
        impact our ability to provide or continue to provide services.
      </LegalParagraph>
      <LegalParagraph>
        Customers cannot refuse collection, use and disclosure of their personal information if such
        information is required to:
      </LegalParagraph>
      <LegalList>
        <LegalListItem>be collected, used or disclosed as required by any law;</LegalListItem>
        <LegalListItem>fulfill the terms of any contractual agreement; and</LegalListItem>
        <LegalListItem>
          be collected, used or disclosed as required by any regulators including self regulatory
          organizations
        </LegalListItem>
      </LegalList>
      <LegalParagraph>
        While you may request that we delete your contact details at any time, we cannot recall any
        email we have already sent. If you have any further enquiries about how to withdraw your
        consent, please feel free to enquire using the details provided in the Contact Us section of
        this privacy policy.
      </LegalParagraph>
      <LegalSmallHeading>Right of Access under PIPEDA</LegalSmallHeading>
      <LegalParagraph>
        PIPEDA gives you a general right to access the PII held by businesses subject to this law.
        Under PIPEDA, you need to make your access request in writing and pay a minimal fee of
        $30.00.
      </LegalParagraph>
      <LegalParagraph>
        If any organizational fees seem unjust, you have the right to complain about this. We retain
        the right to decide how we disclose the copies of your PII to you. We will take all
        necessary measures to fulfill your request in 30 days from receipt, otherwise we must inform
        you of our inability to do so before the 30-day timeframe if:
      </LegalParagraph>
      <LegalList>
        <LegalListItem>
          meeting the time limit would unreasonably interfere with our business activities; or
        </LegalListItem>
        <LegalListItem>
          the time required to undertake consultations necessary to respond to the request would
          make it impractical to meet the time limit.
        </LegalListItem>
      </LegalList>
      <LegalParagraph>
        We can also extend the time limit for the length of time required to convert the personal
        information into an alternative format. In these circumstances, we will advise you of the
        delay within the first 30 days and explain the reason for it.
      </LegalParagraph>
      <LegalSmallHeading>Right of rectification under PIPEDA</LegalSmallHeading>
      <LegalParagraph>
        You may request a correction to any factual errors or omissions within your PII. We would
        ask you to provide some evidence to back up your claim. Under PIPEDA, an organization must
        amend the information, as required, if you successfully demonstrate that it's incomplete or
        inaccurate.
      </LegalParagraph>
      <LegalParagraph>
        You may contact us at any time, using the information provided in the Contact Us section of
        this privacy policy if you believe your PII on our systems is incorrect or incomplete.
      </LegalParagraph>
      <LegalParagraph>
        If we cannot agree on changing the information, you have the right to have your concerns
        recorded with the Office of the Privacy Commission of Canada.
      </LegalParagraph>
      <LegalSmallHeading>Compliance with PIPEDA's Ten Principles of Privacy</LegalSmallHeading>
      <LegalParagraph>
        This privacy policy complies with the PIPEDA's requirements and ten principles of privacy,
        which are as follows:
      </LegalParagraph>
      <ol type="1">
        <LegalListItem>
          <strong>Accountability.</strong> AsyncStatus is responsible for the PII under its control
          and will designate one or more persons to ensure organizational accountability for
          compliance with the ten principles of privacy under PIPEDA, whose details are included
          below. All personnel are accountable for the protection of customers' personal
          information.
        </LegalListItem>
        <LegalListItem>
          <strong>Identifying purposes.</strong> AsyncStatus identifies the purposes for which
          personal information is collected at or before the time the information is collected.
        </LegalListItem>
        <LegalListItem>
          <strong>Consent.</strong> Consent is required for AsyncStatus's collection, use or
          disclosure of personal information, except where required or permitted by PIPEDA or other
          law. In addition, when customers access a product or service offered by us, consent is
          deemed to be granted. Express consent may be obtained verbally, in writing or through
          electronic means. Alternatively, consent may be implied through the actions of customers
          or continued use of a product or service following AsyncStatus's notification of changes.
        </LegalListItem>
        <LegalListItem>
          <strong>Limiting collection.</strong> Personal information collected will be limited to
          that which is necessary for the purposes identified by AsyncStatus.
        </LegalListItem>
        <LegalListItem>
          <strong>Limiting use, disclosure and retention.</strong> We will not use or disclose
          personal information for purposes other than those for which the information was
          collected, except with your consent or as required by law. We will retain personal
          information only for as long as is necessary to fulfill the purposes for collecting such
          information and compliance with any legal requirements.
        </LegalListItem>
        <LegalListItem>
          <strong>Accuracy.</strong> Personal information will be maintained by AsyncStatus in an
          accurate, complete and up-to-date format as is necessary for the purpose(s) for which the
          personal information was collected.
        </LegalListItem>
        <LegalListItem>
          <strong>Safeguards.</strong> We will protect personal information with security safeguards
          appropriate to the sensitivity of such information.
        </LegalListItem>
        <LegalListItem>
          <strong>Openness.</strong> We will make our policies and practices relating to the
          collection and management of personal information readily available upon request,
          including our brochures or other information that explain our policies, standards, or
          codes.
        </LegalListItem>
        <LegalListItem>
          <strong>Customer access.</strong> We will inform customers of the existence, use and
          disclosure of their personal information and will provide access to their personal
          information, subject to any legal restrictions. We may require written requests for access
          to personal information and in most cases, will respond within 30 days of receipt of such
          requests. Customers may verify the accuracy and completeness of their personal
          information, and may request the personal information be corrected or updated, if
          appropriate.
        </LegalListItem>
        <LegalListItem>
          <strong>Challenging compliance.</strong> Customers are welcome to direct any questions or
          inquiries concerning our compliance with this privacy policy and PIPEDA requirements using
          the contact information provided in the Contact Us section of this privacy policy.
        </LegalListItem>
      </ol>
      <LegalSmallHeading>Cookie Compliance</LegalSmallHeading>
      <LegalParagraph>
        Our email interactions with our customers are compliant with Canadian Anti-Spam Legislation.
        The Company does not send unsolicited email to persons with whom we have no relationship. We
        will not sell personal information, such as email addresses, to unrelated third-parties. On
        occasion, your personal information may be provided to our third-party partners to
        administer the products and services you request from us.
      </LegalParagraph>
      <LegalParagraph>
        When you leave our website by linking to another website, you are subject to the privacy and
        security policies of the new website. We encourage you to read the privacy policies of all
        websites you visit, especially if you share any personal information with them.
      </LegalParagraph>
      <LegalParagraph>Please refer to our Cookie Policy for more information.</LegalParagraph>
      <LegalSmallHeading>Enquiries, Reports and Escalation</LegalSmallHeading>
      <LegalParagraph>
        To enquire about AsyncStatus's privacy policy, or to report violations of user privacy, you
        may contact us using the details in the Contact us section of this privacy policy.
      </LegalParagraph>
      <LegalParagraph>
        If we fail to resolve your concern to your satisfaction, you may also contact the Office of
        the Privacy Commissioner of Canada:
      </LegalParagraph>
      <LegalParagraph>
        30 Victoria Street <br />
        Gatineau, QC K1A 1H3 <br />
        Toll Free: 1.800.282.1376 <br />
        www.priv.gc.ca
      </LegalParagraph>
      <LegalSubheading>
        Additional Disclosures for UK General Data Protection Regulation (UK GDPR) Compliance (UK)
      </LegalSubheading>
      <LegalSmallHeading>Data Controller / Data Processor</LegalSmallHeading>
      <LegalParagraph>
        The GDPR distinguishes between organizations that process personal information for their own
        purposes (known as "data controllers") and organizations that process personal information
        on behalf of other organizations (known as "data processors"). We, AsyncStatus, located at
        the address provided in our Contact Us section, are a Data Controller and/or Processor with
        respect to the personal information you provide to us.
      </LegalParagraph>
      <LegalSmallHeading>Third-Party Provided Content</LegalSmallHeading>
      <LegalParagraph>
        We may indirectly collect personal information about you from third-parties who have your
        permission to share it. For example, if you purchase a product or service from a business
        working with us, and give your permission for us to use your details in order to complete
        the transaction.
      </LegalParagraph>
      <LegalParagraph>
        We may also collect publicly available information about you, such as from any social media
        and messaging platforms you may use. The availability of this information will depend on
        both the privacy policies and your own privacy settings on such platforms.
      </LegalParagraph>
      <LegalSmallHeading>
        Additional Disclosure for Collection and Use of Personal Information
      </LegalSmallHeading>
      <LegalParagraph>
        In addition to the aforementioned purposes warranting the collection and use of personal
        information, we may also conduct marketing and market research activities, including how
        visitors use our site, website improvement opportunities and user experience.
      </LegalParagraph>
      <LegalSmallHeading>
        Personal Information No Longer Required for Our Purposes
      </LegalSmallHeading>
      <LegalParagraph>
        If your personal information is no longer required for our stated purposes, or if you
        instruct us under your Data Subject Rights, we will delete it or make it anonymous by
        removing all details that identify you ("Anonymisation"). However, if necessary, we may
        retain your personal information for our compliance with a legal, accounting, or reporting
        obligation or for archiving purposes in the public interest, scientific, or historical
        research purposes or statistical purposes.
      </LegalParagraph>
      <LegalSubheading>Legal Bases for Processing Your Personal Information</LegalSubheading>
      <LegalParagraph>
        Data Protection and Privacy Laws permit us to collect and use your personal data on a
        limited number of grounds.. In which case, we will collect and use your personal information
        lawfully, fairly and in a transparent manner. We never directly market to any person(s)
        under 18 years of age.
      </LegalParagraph>
      <LegalParagraph>
        Our lawful bases depend on the services you use and how you use them. This is a
        non-exhaustive list of the lawful bases we use:
      </LegalParagraph>
      <LegalHeading>Consent From You</LegalHeading>
      <LegalParagraph>
        Where you give us consent to collect and use your personal information for a specific
        purpose. You may withdraw your consent at any time using the facilities we provide; however
        this will not affect any use of your information that has already taken place. When you
        contact us, we assume your consent based on your positive action of contact, therefore you
        consent to your name and email address being used so we can respond to your enquiry.
      </LegalParagraph>
      <LegalParagraph>
        Where you agree to receive marketing communications from us, we will do so based solely on
        your indication of consent or until you instruct us not to, which you can do at any time.
      </LegalParagraph>
      <LegalParagraph>
        While you may request that we delete your contact details at any time, we cannot recall any
        email we have already sent. If you have any further enquiries about how to withdraw your
        consent, please feel free to enquire using the details provided in the Contact Us section of
        this privacy policy.
      </LegalParagraph>
      <LegalSmallHeading>Performance of a Contract or Transaction</LegalSmallHeading>
      <LegalParagraph>
        Where you have entered into a contract or transaction with us, or in order to take
        preparatory steps prior to our entering into a contract or transaction with you. For
        example, if you contact us with an enquiry, we may require personal information such as your
        name and contact details in order to respond.
      </LegalParagraph>
      <LegalSmallHeading>Our Legitimate Interests</LegalSmallHeading>
      <LegalParagraph>
        Where we assess it is necessary for our legitimate interests, such as for us to provide,
        operate, improve and communicate our services. We consider our legitimate interests to
        include research and development, understanding our audience, marketing and promoting our
        services, measures taken to operate our services efficiently, marketing analysis, and
        measures taken to protect our legal rights and interests.
      </LegalParagraph>
      <LegalSmallHeading>Compliance with Law</LegalSmallHeading>
      <LegalParagraph>
        In some cases, we may have a legal obligation to use or keep your personal information. Such
        cases may include (but are not limited to) court orders, criminal investigations, government
        requests, and regulatory obligations. For example, we are required to keep financial records
        for a period of 7 years. If you have any further enquiries about how we retain personal
        information in order to comply with the law, please feel free to enquire using the details
        provided in the Contact Us section of this privacy policy.
      </LegalParagraph>
      <LegalSmallHeading>International Transfers of Personal Information</LegalSmallHeading>
      <LegalParagraph>
        The personal information we collect is stored and/or processed in the United Kingdom by us.
        Following an adequacy decision by the EU Commission, the UK has been granted an essentially
        equivalent level of protection to that guaranteed under UK GDPR.
      </LegalParagraph>
      <LegalParagraph>
        On some occasions, where we share your data with third parties, they may be based outside of
        the UK, or the European Economic Area ("EEA"). These countries to which we store, process,
        or transfer your personal information may not have the same data protection laws as the
        country in which you initially provided the information.
      </LegalParagraph>
      <LegalParagraph>
        If we transfer your personal information to third parties in other countries:
      </LegalParagraph>
      <LegalList>
        <LegalListItem>
          we will perform those transfers in accordance with the requirements of the UK GDPR
          (Article 45) and Data Protection Act 2018;
        </LegalListItem>
        <LegalListItem>
          we will adopt appropriate safeguards for protecting the transferred data, including in
          transit, such as standard contractual clauses ("SCCs") or binding corporate rules.
        </LegalListItem>
      </LegalList>
      <LegalSmallHeading>Your Data Subject Rights</LegalSmallHeading>
      <LegalParagraph>
        <strong>Right to Restrict Processing:</strong> You have the right to request that we
        restrict the processing of your personal information if (i) you are concerned about the
        accuracy of your personal information; (ii) you believe your personal information has been
        unlawfully processed; (iii) you need us to maintain the personal information solely for the
        purpose of a legal claim; or (iv) we are in the process of considering your objection in
        relation to processing on the basis of legitimate interests.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Right to Object:</strong> You have the right to object to processing of your
        personal information that is based on our legitimate interests or public interest. If this
        is done, we must provide compelling legitimate grounds for the processing which overrides
        your interests, rights, and freedoms, in order to proceed with the processing of your
        personal information.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Right to be Informed:</strong> You have the right to be informed with how your data
        is collected, processed, shared and stored.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Right of Access:</strong> You may request a copy of the personal information that we
        hold about you at any time by submitting a Data Subject Access Request (DSAR). The statutory
        deadline for fulfilling a DSAR request is 30 calendar days from our receipt of your request.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Right to Erasure:</strong> In certain circumstances, you can ask for your personal
        data to be erased from the records held by organizations. However this is a qualified right;
        it is not absolute, and may only apply in certain circumstances.
      </LegalParagraph>
      <LegalParagraph>When may the right to erasure apply?</LegalParagraph>
      <LegalList>
        <LegalListItem>
          When the personal data is no longer necessary for the purpose for which it was originally
          collected or processed for.
        </LegalListItem>
        <LegalListItem>
          If consent was the lawful basis for processing personal data and that consent has been
          withdrawn. AsyncStatus relies on consent to process personal data in very few
          circumstances.
        </LegalListItem>
        <LegalListItem>
          The Company is relying on legitimate interests as a legal basis for processing personal
          data and an individual has exercised the right to object and it has been determined that
          the Company has no overriding legitimate grounds to refuse that request.
        </LegalListItem>
        <LegalListItem>
          Personal data are being processed for direct marketing purposes e.g. a person's name and
          email address, and the individual objects to that processing.
        </LegalListItem>
        <LegalListItem>
          There is legislation that requires that personal data are to be destroyed.
        </LegalListItem>
      </LegalList>
      <LegalParagraph>
        <strong>Right to Portability:</strong> Individuals have the right to get some of their
        personal data from an organisation in a way that is accessible and machine-readable, for
        example as a csv file. Associated with this, individuals also have the right to ask an
        organisation to transfer their personal data to another organisation.
      </LegalParagraph>
      <LegalParagraph>However, the right to portability:</LegalParagraph>
      <LegalList>
        <LegalListItem>
          only applies to personal data which a person has directly given to AsyncStatus in
          electronic form; and
        </LegalListItem>
        <LegalListItem>
          onward transfer will only be available where this is "technically feasible".
        </LegalListItem>
      </LegalList>
      <LegalParagraph>
        <strong>Right to Rectification:</strong> If personal data is inaccurate, out of date, or
        incomplete, individuals have the right to correct, update or complete that data.
        Collectively this is referred to as the right to rectification. Rectification may involve
        filling the gaps i.e. to have to have incomplete personal data completed - although this
        will depend on the purposes for the processing. This may involve adding a supplementary
        statement to the incomplete data to highlight any inaccuracy or claim thereof.
      </LegalParagraph>
      <LegalParagraph>
        This right only applies to an individual's own personal data; a person cannot seek the
        rectification of another person's information.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Notification of data breaches:</strong> Upon discovery of a data breach, we will
        investigate the incident and report it to the UK's data protection regulator and yourself,
        if we deem it appropriate to do so.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Complaints:</strong> You have the right, at any time, to lodge a complaint with the
        Information Commissioner's Office (ICO), the UK supervisory authority for data protection
        issues (www.ico.org.uk). We would, however, appreciate the chance to deal with your concerns
        before you approach the ICO so please contact us in the first instance using the details
        below. Please provide us with as much information as you can about the alleged breach. We
        will promptly investigate your complaint and respond to you, in writing, setting out the
        outcome of our investigation and the steps we will take to deal with your complaint.
      </LegalParagraph>
      <LegalSmallHeading>Enquiries, Reports and Escalation</LegalSmallHeading>
      <LegalParagraph>
        To enquire about AsyncStatus's privacy policy, or to report violations of user privacy, you
        may contact our Data Protection Officer using the details in the Contact us section of this
        privacy policy.
      </LegalParagraph>
      <LegalParagraph>
        If we fail to resolve your concern to your satisfaction, you may also contact the
        Information Commissioner's Office (ICO), the UK Data Protection regulator:
      </LegalParagraph>
      <LegalParagraph>
        Information Commissioner's Office <br />
        Wycliffe House <br />
        Water Lane <br />
        Wilmslow <br />
        Cheshire <br />
        SK9 5AF <br />
        <br />
        Tel: 0303 123 1113 (local rate) <br />
        Website: www.ico.org.uk
      </LegalParagraph>
      <LegalSubheading>Contact Us</LegalSubheading>
      <LegalParagraph>
        For any questions or concerns regarding your privacy, you may contact us using the following
        details:
      </LegalParagraph>
      <LegalParagraph>
        Kacper Ochmański
        <br />
        kacper@asyncstatus.com
      </LegalParagraph>
    </LegalDocument>
  );
}
