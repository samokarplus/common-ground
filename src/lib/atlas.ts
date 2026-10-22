/**
 * Thought Atlas data. The first 19 nodes live in content.ts; this file adds richer
 * entries. Summaries are editorial drafts written by Common Ground, linked to a
 * Stanford Encyclopedia of Philosophy (SEP) entry whose URL was checked to exist.
 * They are not peer reviewed. Edges are reading paths, not claims of influence.
 */
import { atlasEdges as baseEdges, atlasNodes as baseNodes } from "./content.ts";

export type AtlasKind = "Thinker" | "Tradition" | "Institution" | "Ethics" | "Concept";
export type AtlasNode = {
  id: string;
  name: string;
  period: string;
  description: string;
  source: string;
  thinkers?: string[];
  contested?: string;
  example?: string;
};

const sep = (slug: string) => `https://plato.stanford.edu/entries/${slug}/`;
type Row = [id: string, name: string, period: string, slug: string, description: string, thinkers: string[], contested: string, example: string];

const rows: Row[] = [
  // Traditions
  ["liberalism", "Liberalism", "Tradition", "liberalism", "A political tradition that gives priority to individual liberty, equal basic rights, and limited, accountable government.", ["John Locke", "Immanuel Kant", "J. S. Mill", "John Rawls"], "Classical liberals stress property rights and a limited state; egalitarian liberals defend a larger state role in securing fair opportunity. In everyday U.S. speech 'liberal' usually means center-left, which is narrower than the philosophical term.", "Constitutional protections for religion, speech, and due process."],
  ["conservatism", "Conservatism", "Tradition", "conservatism", "A family of views that value continuity, inherited institutions, and gradual change, and are wary of rapid redesign of society.", ["Edmund Burke", "Michael Oakeshott"], "Traditionalist, free-market, religious, and national conservatives emphasize different things. Thinkers disagree on whether conservatism is a doctrine or a disposition.", "Burke's 1790 Reflections on the Revolution in France is a common starting text."],
  ["libertarianism", "Libertarianism", "Tradition", "libertarianism", "The view that individual liberty, especially over one's person and property, should sharply limit what the state may do.", ["Robert Nozick", "Murray Rothbard"], "Right-libertarians and left-libertarians disagree about who may own natural resources. Some defend liberty by appeal to rights, others by its good consequences.", "Arguments for minimal government in Nozick's Anarchy, State, and Utopia (1974)."],
  ["socialism", "Socialism", "Tradition", "socialism", "A family of views that criticize inequalities produced by capitalist markets and favor social ownership or strong democratic control of economic life.", ["Karl Marx", "Friedrich Engels", "Eduard Bernstein"], "Revolutionary and reformist socialists differ on method; market socialists and central planners differ on how an economy should run.", "Cooperative enterprises and public ownership of utilities are practical examples."],
  ["social-democracy", "Social democracy", "Tradition", "socialism", "A reformist tradition that keeps a market economy while using democratic government, welfare provision, and regulation to limit inequality and insecurity.", ["Eduard Bernstein"], "Supporters and critics disagree about how much redistribution is compatible with growth, and whether it is a stable alternative to socialism or a form of regulated capitalism.", "Universal public services and strong labor protections in several European countries."],
  ["anarchism", "Anarchism", "Tradition", "anarchism", "A family of views that reject the state's claim to legitimate authority and favor voluntary cooperation.", ["William Godwin", "Pierre-Joseph Proudhon", "Peter Kropotkin", "Emma Goldman"], "Individualist and communist anarchists disagree about property. Philosophers also debate whether any state authority can be morally justified.", "Voluntary mutual-aid associations."],
  ["republicanism", "Civic republicanism", "Tradition", "republicanism", "A tradition that understands liberty as freedom from domination and stresses citizenship, civic participation, and mixed government. It is unrelated to any modern political party.", ["Cicero", "Niccolo Machiavelli", "Philip Pettit"], "Scholars disagree on how much civic virtue republicanism demands and how it differs from liberalism.", "Checks and balances designed so no one can rule arbitrarily."],
  ["communitarianism", "Communitarianism", "Tradition", "communitarianism", "A set of views stressing that people are shaped by communities and that the common good deserves weight alongside individual rights.", ["Michael Sandel", "Alasdair MacIntyre", "Charles Taylor", "Michael Walzer"], "Is it a rival to liberalism or a correction from within? Critics worry it can pressure dissenters to conform.", "Debates over civic service and local control."],
  ["feminism-political", "Feminist political thought", "Tradition", "feminism-political", "Analyses of how gender shapes power, law, and the line between public and private life.", ["Mary Wollstonecraft", "J. S. Mill", "Susan Moller Okin"], "Liberal, radical, difference, and intersectional approaches disagree about causes and remedies.", "Debates over family law and equal pay."],
  ["nationalism", "Nationalism", "Tradition", "nationalism", "The view that nations are important political units and that membership in a nation can ground loyalty and claims to self-government.", ["Johann Gottfried Herder", "David Miller"], "Civic nationalism rests on shared institutions; ethnic nationalism on ancestry or culture. Philosophers disagree on whether national partiality is justified.", "Movements for national self-determination."],
  ["cosmopolitanism", "Cosmopolitanism", "Tradition", "cosmopolitanism", "The view that all human beings belong to one moral community and that this should shape political obligations beyond borders.", ["Diogenes", "Immanuel Kant", "Martha Nussbaum"], "Moral cosmopolitans and institutional cosmopolitans differ on whether duties to strangers require global institutions.", "International human-rights law."],
  ["multiculturalism", "Multiculturalism", "Tradition", "multiculturalism", "Approaches that ask how states should respond fairly to cultural, religious, and ethnic diversity.", ["Will Kymlicka", "Charles Taylor", "Bhikhu Parekh"], "Disagreement centers on group rights versus equal individual treatment, and on limits for illiberal practices.", "Language rights and religious accommodations."],
  ["egalitarianism", "Egalitarianism", "Tradition", "egalitarianism", "A family of views holding that equality, in some form, is a central requirement of justice.", ["John Rawls", "Ronald Dworkin", "G. A. Cohen"], "Equality of what? Resources, welfare, opportunity, and relationships are different answers. 'Leveling down' objections test the view.", "Progressive taxation and equal-access laws."],
  ["neoliberalism", "Neoliberalism", "Tradition", "neoliberalism", "A contested term for thought and policy that favors markets, privatization, deregulation, and open trade.", ["Friedrich Hayek", "Milton Friedman"], "Scholars disagree on what the term covers, and it is used both descriptively and as criticism.", "Privatization and deregulation programs from the late twentieth century."],
  // Institutions and political concepts
  ["democracy", "Democracy", "Institution", "democracy", "Rule by the people, ranging from voting for representatives to broader participation and public deliberation.", ["Rousseau", "Joseph Schumpeter", "Robert Dahl", "Jurgen Habermas"], "Direct versus representative forms, majority rule versus minority protection, and whether democracy is valuable for its fairness or for its results.", "Competitive elections with universal suffrage."],
  ["constitutionalism", "Constitutionalism", "Institution", "constitutionalism", "The idea that government authority is created and limited by a fundamental law.", ["James Madison", "Montesquieu"], "In U.S. debates, originalists and 'living constitution' interpreters disagree about how to read old text; others ask how much courts should override legislatures.", "A written constitution with a bill of rights."],
  ["federalism", "Federalism", "Institution", "federalism", "A system dividing authority between a national government and regional governments.", ["Alexander Hamilton", "James Madison"], "Supporters cite local choice and policy experimentation; critics cite unequal protection of rights and 'races to the bottom'.", "U.S. states and the federal government; Switzerland's cantons."],
  ["separation-of-powers", "Separation of powers", "Institution", "montesquieu", "Dividing government among legislative, executive, and judicial branches so each can check the others. Linked entry is on Montesquieu, who influenced the idea.", ["Montesquieu", "James Madison"], "Strict separation or overlapping powers? Modern administrative agencies blur the original categories.", "Articles I to III of the U.S. Constitution."],
  ["rule-of-law", "Rule of law", "Institution", "rule-of-law", "The principle that law governs officials and citizens alike, and that laws are public, general, prospective, and fairly applied.", ["A. V. Dicey", "Lon Fuller", "Joseph Raz"], "Formal theories ask only for proper legal form; substantive theories also require just content.", "Independent courts and equal application of law."],
  ["sovereignty", "Sovereignty", "Institution", "sovereignty", "Supreme authority within a territory, and independence from outside control.", ["Jean Bodin", "Thomas Hobbes"], "Popular sovereignty places it in the people; critics ask how that fits with international law and shared power.", "Treaties as voluntary limits on state power."],
  ["legitimacy", "Political legitimacy", "Institution", "legitimacy", "The question of when political power is rightful and not merely effective.", ["Max Weber", "John Rawls"], "Consent, fair procedures, and good outcomes are competing grounds.", "Free and fair elections as a source of authority."],
  ["political-representation", "Political representation", "Institution", "political-representation", "How elected officials act for others: as delegates who follow instructions or trustees who use their own judgment.", ["Edmund Burke", "Hanna Pitkin"], "Delegate versus trustee models, and whether representatives should resemble those they represent.", "Legislators choosing between constituent opinion and personal judgment."],
  ["voting-methods", "Voting and electoral systems", "Institution", "voting-methods", "Rules for turning ballots into outcomes, such as plurality, ranked-choice, and proportional systems.", ["Kenneth Arrow", "Condorcet"], "Every system makes trade-offs, and Arrow's theorem shows no ranking system satisfies all fairness conditions at once.", "Single-winner plurality versus proportional representation."],
  ["social-choice", "Social choice and public choice", "Institution", "social-choice", "Social choice studies how individual preferences can be combined into collective decisions; public choice applies economic methods to political behavior. The linked entry covers social choice.", ["Kenneth Arrow", "James Buchanan", "Gordon Tullock"], "Public choice's claims about self-interested officials are debated, as is how far its models describe real politics.", "Analyses of voting paradoxes and interest-group influence."],
  ["citizenship", "Citizenship", "Institution", "citizenship", "Membership in a political community with rights and responsibilities.", ["Aristotle", "T. H. Marshall"], "Debates cover who should be admitted, whether citizenship carries civic duties, and global alternatives.", "Voting rights and jury service."],
  ["civil-disobedience", "Civil disobedience", "Institution", "civil-disobedience", "Public, conscientious, nonviolent lawbreaking intended to change a law or policy.", ["Henry David Thoreau", "Martin Luther King Jr.", "John Rawls"], "Philosophers disagree on whether it must accept punishment and what injustice justifies it.", "King's 1963 Letter from Birmingham Jail."],
  ["toleration", "Toleration", "Institution", "toleration", "Refraining from coercing views or practices one disapproves of.", ["John Locke", "Pierre Bayle", "J. S. Mill"], "Where are the limits, and is toleration a stance of respect or mere forbearance?", "Religious freedom after early modern wars of religion."],
  ["free-speech", "Free speech", "Institution", "freedom-speech", "The protection of expression from government punishment, and the debate over its justification and limits.", ["J. S. Mill", "Oliver Wendell Holmes Jr."], "Debates include hate speech, incitement, misinformation, and private platform moderation. Law differs across countries.", "First Amendment doctrine in the United States."],
  ["privacy", "Privacy", "Institution", "privacy", "Control over access to oneself, one's information, and personal decisions.", ["Samuel Warren", "Louis Brandeis", "Judith Jarvis Thomson"], "Is privacy a distinct right or a cluster of other rights? How should it be weighed against security?", "Limits on government data collection."],
  ["property", "Property", "Institution", "property", "Systems of rights to control and benefit from things, and the justification for them.", ["John Locke", "G. W. F. Hegel", "Karl Marx"], "Theories rest on labor, utility, personality, or fair institutions, and give different views of redistribution.", "Private ownership versus public lands and commons."],
  ["punishment", "Punishment", "Institution", "punishment", "The justification for imposing penalties on offenders.", ["Cesare Beccaria", "Immanuel Kant", "Jeremy Bentham"], "Retribution, deterrence, rehabilitation, and incapacitation point to different policies.", "Debates over sentencing and the death penalty."],
  ["immigration", "Immigration ethics", "Institution", "immigration", "Philosophical questions about who may enter and settle in a state, and on what terms.", ["Michael Walzer", "Joseph Carens", "David Miller"], "Arguments range from open borders to broad state discretion to limits grounded in fairness and duties to refugees.", "Refugee protection and admission policies."],
  ["just-war", "Just war", "Institution", "war", "A tradition setting moral conditions for starting a war and for conduct within it.", ["Augustine", "Thomas Aquinas", "Michael Walzer"], "Pacifists reject war outright; realists doubt moral limits apply; just-war theorists disagree over preventive war and civilian risk.", "International law on armed conflict."],
  ["public-reason", "Public reason", "Institution", "public-reason", "The idea that coercive laws should be justifiable in terms all reasonable citizens could accept.", ["John Rawls", "Jurgen Habermas"], "Critics argue it can unfairly exclude religious arguments, while defenders say it respects equal standing.", "Courts and legislators explaining decisions in shared terms."],
  ["common-good", "The common good", "Institution", "common-good", "Conditions that benefit members of a community together, not as separate individuals.", ["Aristotle", "Thomas Aquinas", "Jean-Jacques Rousseau"], "Whether it names a real shared interest, and who decides what it requires.", "Public health and clean air."],
  ["solidarity", "Solidarity", "Institution", "solidarity", "Mutual commitment among people who share a cause or fate.", ["Emile Durkheim"], "Disputes about its scope: a group, a nation, or all humanity.", "Labor movements and mutual aid."],
  ["trust", "Trust and institutional trust", "Institution", "trust", "Reliance on others, or on institutions, to act in ways one expects and endorses.", ["Annette Baier", "Russell Hardin"], "Trust can be misplaced, so researchers distinguish trust from trustworthiness.", "Public confidence in courts or elections."],
  ["secularism", "Secularism and religion in politics", "Institution", "religion-politics", "Positions on how religion and government should relate.", ["John Locke", "John Rawls"], "Arrangements differ: U.S. disestablishment, French laicite, and established churches in some democracies.", "Debates over religious accommodations."],
  ["pluralism", "Value pluralism", "Concept", "value-pluralism", "The view that there are many genuine values that can conflict and cannot be reduced to one measure.", ["Isaiah Berlin", "Bernard Williams"], "Does pluralism imply relativism? Defenders say no.", "Trade-offs between liberty and equality."],
  // Ethics and justice
  ["utilitarianism", "Utilitarianism", "Ethics", "utilitarianism-history", "The view that right actions or policies are those that produce the greatest overall well-being.", ["Jeremy Bentham", "J. S. Mill", "Henry Sidgwick", "Peter Singer"], "Act versus rule versions, how to measure well-being, and whether it can respect individual rights.", "Cost-benefit analysis in public policy."],
  ["consequentialism", "Consequentialism", "Ethics", "consequentialism", "The family of theories judging acts by their outcomes.", ["Henry Sidgwick", "Derek Parfit"], "Disagreement over which outcomes count and how to aggregate them.", "Evaluating policies by results."],
  ["virtue-ethics", "Virtue ethics", "Ethics", "ethics-virtue", "An approach centered on character and flourishing, not rules or outcomes alone.", ["Aristotle", "Elizabeth Anscombe", "Rosalind Hursthouse"], "Critics ask whether it guides action; defenders say good judgment can.", "Civic virtue in public life."],
  ["contractualism", "Contractualism", "Ethics", "contractualism", "Morality as principles no one could reasonably reject.", ["T. M. Scanlon"], "How to interpret reasonable rejection and how to treat large aggregates.", "Fair rules for shared risks."],
  ["social-contract", "Social contract theory", "Ethics", "contractarianism", "Political authority justified by an agreement, actual or hypothetical, among free and equal persons.", ["Thomas Hobbes", "John Locke", "Jean-Jacques Rousseau", "John Rawls"], "Hypothetical consent may not bind anyone, as Hume argued, and thinkers differ on the starting conditions.", "Rawls's original position."],
  ["natural-law", "Natural law", "Ethics", "natural-law-theories", "Theories holding that there are moral standards grounded in human nature or reason that can evaluate human law.", ["Thomas Aquinas", "John Finnis"], "Religious and secular versions differ, and so do views on whether an unjust law is still law.", "Appeals to rights not granted by statute."],
  ["moral-relativism", "Moral relativism", "Ethics", "moral-relativism", "The view that moral claims are true or justified only relative to a framework, such as a culture.", ["Gilbert Harman", "David Wong"], "Distinguishing descriptive diversity of moral views from the philosophical claim that no view is better.", "Disagreement over cross-cultural criticism."],
  ["capability-approach", "Capability approach", "Ethics", "capability-approach", "Judging well-being and justice by what people are able to do and be.", ["Amartya Sen", "Martha Nussbaum"], "Whether to fix a list of central capabilities or leave it to democratic choice.", "Human development indices."],
  ["distributive-justice", "Distributive justice", "Ethics", "justice-distributive", "Principles for fairly dividing the benefits and burdens of social cooperation.", ["John Rawls", "Robert Nozick", "Ronald Dworkin"], "Equality, priority to the worse off, sufficiency, desert, and entitlement give different answers.", "Tax and transfer systems."],
  ["equal-opportunity", "Equality of opportunity", "Ethics", "equal-opportunity", "The idea that people should have fair chances to compete for positions.", ["John Rawls", "Ronald Dworkin"], "Formal equality, fair equality, and luck-egalitarian versions differ on how far to correct for background disadvantage.", "Anti-discrimination law and education funding."],
  ["meritocracy", "Meritocracy", "Ethics", "meritocracy", "A system that allocates positions and rewards according to merit.", ["Michael Young", "Michael Sandel"], "What counts as merit, and whether it is truly independent of luck and background. Young coined the term in a 1958 satire.", "Competitive exams and hiring."],
  ["paternalism", "Paternalism", "Ethics", "paternalism", "Interfering with someone's choices for their own good.", ["J. S. Mill", "Richard Thaler", "Cass Sunstein"], "Where is the line between legitimate protection and disrespect for autonomy? 'Nudge' proposals try a middle path.", "Seat-belt laws and default savings plans."],
  ["authority", "Political authority", "Ethics", "authority", "A claimed right to rule, creating duties to obey.", ["Thomas Hobbes", "Joseph Raz", "Robert Paul Wolff"], "Philosophical anarchists doubt anyone has a duty to obey; others ground it in consent, fairness, or service.", "Obeying laws one disagrees with."],
  ["global-justice", "Global justice", "Ethics", "justice-global", "Questions of fairness among states and persons across borders.", ["John Rawls", "Peter Singer", "Thomas Pogge"], "Statists limit justice to shared institutions, while cosmopolitans extend it to all persons.", "Duties around aid, trade, and climate."],
  ["environmental-ethics", "Environmental ethics", "Ethics", "ethics-environmental", "Moral questions about humans' relation to nature and future generations.", ["Aldo Leopold", "Hans Jonas"], "Is nature valuable in itself or only for people?", "Climate policy and conservation."],
  // Thinkers
  ["hobbes", "Thomas Hobbes", "Early modern", "hobbes", "Argued in Leviathan (1651) that without a sovereign, life would be a war of all against all.", [], "", ""],
  ["machiavelli", "Niccolo Machiavelli", "Early modern", "machiavelli", "Renaissance writer on political power and republican liberty (The Prince, Discourses).", [], "", ""],
  ["montesquieu", "Montesquieu", "Early modern", "montesquieu", "Author of The Spirit of the Laws (1748), a major source for ideas about separated powers.", [], "", ""],
  ["hume", "David Hume", "Early modern", "hume-moral", "Scottish philosopher who tied morality to sentiment and criticized social-contract theory.", [], "", ""],
  ["kant", "Immanuel Kant", "Early modern", "kant", "German philosopher whose ethics centers on duty and respect for persons as ends in themselves.", [], "", ""],
  ["burke", "Edmund Burke", "Early modern", "burke", "Irish-born statesman whose critique of the French Revolution shaped conservative thought.", [], "", ""],
  ["wollstonecraft", "Mary Wollstonecraft", "Early modern", "wollstonecraft", "Author of A Vindication of the Rights of Woman (1792), an early argument for women's education and equality.", [], "", ""],
  ["bentham", "Jeremy Bentham", "Early modern", "bentham", "Founder of modern utilitarianism and advocate of legal reform.", [], "", ""],
  ["aquinas", "Thomas Aquinas", "Classical", "aquinas", "Medieval theologian who developed influential natural-law and just-war ideas.", [], "", ""],
  ["confucius", "Confucius", "Classical", "confucius", "Chinese thinker whose teachings emphasize virtue, family roles, and good governance.", [], "", ""],
  ["dewey", "John Dewey", "Modern", "dewey", "American philosopher who treated democracy as a way of shared life and inquiry.", [], "", ""],
  ["berlin", "Isaiah Berlin", "Contemporary", "berlin", "Author of Two Concepts of Liberty (1958) and defender of value pluralism.", [], "", ""],
  ["habermas", "Jurgen Habermas", "Contemporary", "habermas", "German theorist of communicative action and deliberative democracy.", [], "", ""],
];

const extra: AtlasNode[] = rows.map(([id, name, period, slug, description, thinkers, contested, example]) => ({
  id,
  name,
  period,
  description,
  source: sep(slug),
  ...(thinkers.length ? { thinkers } : {}),
  ...(contested ? { contested } : {}),
  ...(example ? { example } : {}),
}));

export const atlasNodes: AtlasNode[] = [...baseNodes, ...extra];

const more: [string, string][] = [
  ["liberalism", "locke"], ["liberalism", "mill"], ["liberalism", "kant"], ["liberalism", "rawls"], ["liberalism", "toleration"], ["liberalism", "libertarianism"], ["liberalism", "egalitarianism"],
  ["conservatism", "burke"], ["conservatism", "hume"], ["conservatism", "communitarianism"], ["conservatism", "constitutionalism"],
  ["libertarianism", "property"], ["libertarianism", "liberty"], ["libertarianism", "neoliberalism"],
  ["socialism", "marx"], ["socialism", "social-democracy"], ["socialism", "egalitarianism"], ["socialism", "anarchism"], ["social-democracy", "distributive-justice"],
  ["anarchism", "authority"], ["anarchism", "state"],
  ["republicanism", "machiavelli"], ["republicanism", "citizenship"], ["republicanism", "liberty"], ["republicanism", "separation-of-powers"],
  ["communitarianism", "common-good"], ["communitarianism", "liberalism"], ["communitarianism", "solidarity"],
  ["feminism-political", "wollstonecraft"], ["feminism-political", "equality"], ["feminism-political", "mill"],
  ["nationalism", "sovereignty"], ["nationalism", "cosmopolitanism"], ["nationalism", "citizenship"], ["nationalism", "immigration"],
  ["cosmopolitanism", "global-justice"], ["cosmopolitanism", "kant"], ["cosmopolitanism", "stoicism"],
  ["multiculturalism", "toleration"], ["multiculturalism", "pluralism"], ["multiculturalism", "citizenship"],
  ["egalitarianism", "equal-opportunity"], ["egalitarianism", "equality"], ["egalitarianism", "distributive-justice"],
  ["neoliberalism", "property"],
  ["democracy", "voting-methods"], ["democracy", "political-representation"], ["democracy", "legitimacy"], ["democracy", "habermas"], ["democracy", "dewey"], ["democracy", "rousseau"], ["democracy", "aristotle"],
  ["constitutionalism", "separation-of-powers"], ["constitutionalism", "rule-of-law"], ["constitutionalism", "federalism"], ["constitutionalism", "rights"],
  ["federalism", "sovereignty"], ["separation-of-powers", "montesquieu"], ["separation-of-powers", "rule-of-law"],
  ["rule-of-law", "legitimacy"], ["rule-of-law", "justice"],
  ["sovereignty", "hobbes"], ["sovereignty", "state"], ["legitimacy", "authority"], ["legitimacy", "social-contract"], ["legitimacy", "state"],
  ["political-representation", "burke"], ["voting-methods", "social-choice"], ["social-choice", "utilitarianism"],
  ["citizenship", "immigration"], ["citizenship", "aristotle"],
  ["civil-disobedience", "rawls"], ["civil-disobedience", "justice"], ["civil-disobedience", "authority"],
  ["toleration", "locke"], ["toleration", "secularism"], ["toleration", "free-speech"],
  ["free-speech", "mill"], ["free-speech", "liberty"], ["free-speech", "privacy"],
  ["privacy", "rights"], ["property", "locke"], ["property", "marx"], ["property", "distributive-justice"],
  ["punishment", "kant"], ["punishment", "bentham"], ["punishment", "justice"],
  ["immigration", "global-justice"], ["just-war", "aquinas"], ["just-war", "justice"],
  ["public-reason", "rawls"], ["public-reason", "habermas"], ["public-reason", "secularism"],
  ["common-good", "aristotle"], ["common-good", "aquinas"], ["solidarity", "equality"], ["trust", "legitimacy"], ["trust", "democracy"],
  ["secularism", "locke"], ["pluralism", "berlin"], ["pluralism", "liberty"], ["pluralism", "moral-relativism"], ["berlin", "liberty"],
  ["utilitarianism", "bentham"], ["utilitarianism", "mill"], ["utilitarianism", "consequentialism"], ["utilitarianism", "rights"],
  ["consequentialism", "duty"], ["virtue-ethics", "aristotle"], ["virtue-ethics", "confucius"], ["virtue-ethics", "stoicism"],
  ["contractualism", "social-contract"], ["contractualism", "rawls"], ["social-contract", "hobbes"], ["social-contract", "locke"], ["social-contract", "rousseau"], ["social-contract", "hume"],
  ["natural-law", "aquinas"], ["natural-law", "rights"], ["natural-law", "locke"], ["moral-relativism", "justice"],
  ["capability-approach", "equality"], ["capability-approach", "distributive-justice"],
  ["distributive-justice", "rawls"], ["distributive-justice", "justice"], ["equal-opportunity", "meritocracy"], ["meritocracy", "equality"],
  ["paternalism", "mill"], ["paternalism", "liberty"], ["authority", "state"], ["global-justice", "justice"], ["environmental-ethics", "duty"],
  ["hobbes", "state"], ["kant", "duty"], ["kant", "rights"], ["hume", "spinoza"], ["burke", "liberty"], ["aquinas", "aristotle"], ["machiavelli", "state"], ["confucius", "duty"], ["wollstonecraft", "rights"], ["bentham", "rights"], ["dewey", "equality"], ["habermas", "state"], ["montesquieu", "liberty"],
];

export const atlasEdges: [string, string][] = [...(baseEdges as [string, string][]), ...more];
